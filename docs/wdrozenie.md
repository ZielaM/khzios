# Wdrożenie i utrzymanie strony

Instrukcja krok po kroku: uruchomienie produkcyjnej wersji lokalnie (do testów i do wprowadzenia treści), przeniesienie gotowych danych na serwer uczelni, konfiguracja serwera, codzienna obsługa. Szczegóły reverse proxy, ograniczenia dostępu do panelu, fail2ban i kopii zapasowych są w [serwer-uczelni.md](serwer-uczelni.md); tu są do nich odnośniki.

## Jak to jest zbudowane

`docker-compose.yml` uruchamia trzy usługi:

| Usługa    | Co robi                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------- |
| `db`      | PostgreSQL 17, dane w wolumenie `khzios_pgdata`                                                     |
| `migrate` | przy każdym `up` nakłada brakujące migracje bazy i kończy działanie                                 |
| `app`     | strona (Next.js, `next start`, port 3000 w kontenerze), pliki z panelu w wolumenie `khzios_uploads` |

Komplet danych strony to **baza + wolumen `uploads`** (zdjęcia i PDF-y wgrane w panelu). Kod i obraz Dockera można zawsze odtworzyć z repozytorium.

Konfiguracja jest w pliku `.env.docker` (wzór: `.env.docker.example`), który nie trafia do repozytorium:

| Zmienna             | Znaczenie                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD` | hasło bazy; długie i losowe (`openssl rand -hex 24`)                                                                                     |
| `APP_URL`           | publiczny adres strony, np. `https://khzios.up.poznan.pl`; od niego zależą linki kanoniczne, sitemapa i flaga `Secure` ciasteczka panelu |
| `APP_PORT`          | port na serwerze, na który reverse proxy kieruje ruch (domyślnie 3000)                                                                   |
| `APP_BIND`          | `127.0.0.1`, gdy proxy działa na tym samym serwerze (zalecane)                                                                           |
| `ADMIN_PATH`        | adres panelu: 8–63 małe litery, cyfry, myślniki, np. `zaplecze-3f9a1c2b7d4e` (`openssl rand -hex 6`). Pusty = panel wyłączony            |

## Część 1. Uruchomienie lokalnie (test wersji produkcyjnej)

Ten sam zestaw kontenerów co na serwerze, tylko pod `http://localhost:3000`.

1. **Docker w WSL.** Zainstaluj [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) dla Windows, potem Settings → Resources → WSL integration → włącz dla swojej dystrybucji. W terminalu WSL `docker compose version` ma odpowiadać bez błędu.
2. **Konfiguracja** w katalogu projektu:
   ```bash
   cp .env.docker.example .env.docker
   ```
   W `.env.docker` ustaw: `POSTGRES_PASSWORD` (dowolne), `APP_URL=http://localhost:3000`, `ADMIN_PATH=zaplecze-lokalny-test`.
3. **Start** (pierwszy build trwa kilka minut):
   ```bash
   docker compose --env-file .env.docker up -d --build
   docker compose --env-file .env.docker ps     # app: healthy, migrate: exited (0)
   ```
4. **Pierwsze konto panelu** (zapyta o hasło, min. 12 znaków):
   ```bash
   docker compose --env-file .env.docker run --rm migrate pnpm admin:create --login ziela --name "Imię Nazwisko" --role admin
   ```
5. Strona: http://localhost:3000, panel: http://localhost:3000/zaplecze-lokalny-test. Przy pierwszym logowaniu panel pokaże kod QR do aplikacji uwierzytelniającej i kody zapasowe.

Baza startuje **pusta** — strona działa, tylko sekcje nie mają treści. Dane przykładowe (lorem ipsum, konta deweloperskie nie są tworzone w tym trybie) do samego oglądania: `docker compose --env-file .env.docker --profile seed run --rm seed` — **kasuje całą treść**, więc nie używaj tego, jeśli planujesz przenieść dane na serwer (część 2).

Zatrzymanie: `docker compose --env-file .env.docker down` (dane zostają). Usunięcie wszystkiego razem z danymi: `down -v`.

## Część 2. Treść przygotowana lokalnie, przeniesiona na serwer (pg_dump)

**Da się i to dobry plan**: stronę wypełniasz w spokoju u siebie, a serwer od pierwszej minuty pokazuje gotową treść. Warunki:

- **Ten sam stos** co na serwerze (część 1), a nie `pnpm dev` z bazą Neon: ta sama wersja PostgreSQL (17) i pliki w wolumenie Dockera, a w Neonie są dane przykładowe.
- **Czysta baza**: nie uruchamiaj seeda. Zacznij od pustej bazy i wprowadź tylko prawdziwe treści.
- **Ta sama wersja kodu** lokalnie i na serwerze (ten sam commit). Zrzut zawiera tabelę `_prisma_migrations`; jeśli serwer ma nowszy kod, `migrate` doda tylko brakujące migracje, ale starszy kod niż zrzut nie zadziała.
- **Baza i pliki razem**: artykuły wskazują na zdjęcia w `uploads`. Sam zrzut bazy da stronę z niedziałającymi zdjęciami.

### 2.1 Przygotuj dane lokalnie

Wprowadź treści w panelu (część 1). Przed zrzutem usuń dane, które nie powinny trafić na serwer — sesje, próby logowania, kosz:

```bash
docker compose --env-file .env.docker exec db psql -U khzios -d khzios -c \
  'TRUNCATE "AdminSession", "LoginAttempt", "SecurityEvent", "TrashItem";'
```

Konto administratora możesz przenieść razem z bazą (to samo hasło i ta sama aplikacja 2FA zadziałają na serwerze) albo po przeniesieniu założyć nowe i stare zablokować w panelu.

### 2.2 Zrób zrzut

```bash
docker compose --env-file .env.docker exec -T db pg_dump -U khzios -Fc khzios > khzios.dump
docker run --rm -v khzios_uploads:/data:ro -v "$PWD":/backup alpine \
  tar czf /backup/uploads.tar.gz -C /data .
```

Oba pliki (`khzios.dump`, `uploads.tar.gz`) skopiuj na serwer, np. `scp khzios.dump uploads.tar.gz uzytkownik@serwer:/srv/khzios/`. Nie wysyłaj ich przez publiczne kanały: w bazie są hashe haseł i sekrety 2FA kont panelu.

### 2.3 Wgraj na serwer — przed pierwszym uruchomieniem aplikacji

Po krokach 1–3 części 3 (Docker, kod, `.env.docker`), zamiast `up -d`:

```bash
cd /srv/khzios
docker compose --env-file .env.docker build             # obrazy aplikacji
docker compose --env-file .env.docker up -d db           # tylko baza
docker compose --env-file .env.docker exec -T db \
  pg_restore -U khzios -d khzios --no-owner --clean --if-exists < khzios.dump
# Pliki do wolumenu uploads, przez kontener aplikacji (tworzy wolumen jak Compose)
docker compose --env-file .env.docker run --rm --no-deps --user root \
  -v "$PWD":/backup --entrypoint sh app \
  -c 'tar xzf /backup/uploads.tar.gz -C /app/uploads && chown -R node:node /app/uploads'
docker compose --env-file .env.docker up -d              # migracje + aplikacja
```

`chown` nadaje pliki użytkownikowi, na którym działa aplikacja (bez tego nie mogłaby usuwać zdjęć). Sprawdź stronę i panel, a potem usuń `khzios.dump` i `uploads.tar.gz` z serwera.

### Gdyby to nie wypaliło

Najprostsza alternatywa: wdroż pustą stronę (część 3) i wprowadzaj treść **od razu na serwerze** przez panel, zanim ogłosisz adres. Do tego czasu możesz ograniczyć dostęp do całej strony w nginx do sieci uczelni (jak panel w [serwer-uczelni.md, sekcja 2](serwer-uczelni.md#2-opcjonalnie-panel-tylko-z-sieci-uczelni-lub-vpn), tylko dla `location /`). Nie ma wtedy przenoszenia danych ani zgodności wersji do pilnowania.

## Część 3. Serwer uczelni

### 3.1 Wymagania

- Linux z Dockerem (Docker Engine + wtyczka Compose v2) i gitem.
- Min. 2 rdzenie, 4 GB RAM (build aplikacji potrzebuje ok. 2–3 GB), 10 GB dysku + miejsce na zdjęcia i kopie.
- Dostęp do internetu przy budowaniu obrazu (paczki npm, czcionki Google). Działająca strona z internetu niczego nie pobiera.
- Reverse proxy z HTTPS (nginx) i domena — pytania do informatyków uczelni: [serwer-uczelni.md, sekcja 5](serwer-uczelni.md#5-pytania-do-uczelni).

### 3.2 Kod i konfiguracja

```bash
sudo mkdir -p /srv/khzios && sudo chown "$USER" /srv/khzios
git clone https://github.com/ZielaM/khzios.git /srv/khzios
cd /srv/khzios
cp .env.docker.example .env.docker
chmod 600 .env.docker          # hasło bazy i adres panelu
nano .env.docker               # POSTGRES_PASSWORD, APP_URL, ADMIN_PATH (tabela na górze)
```

### 3.3 Uruchomienie

- **Z danymi przygotowanymi lokalnie** → część 2.3.
- **Pusta strona**:
  ```bash
  docker compose --env-file .env.docker up -d --build
  docker compose --env-file .env.docker run --rm migrate pnpm admin:create --login ziela --name "Imię Nazwisko" --role admin
  ```

Sprawdzenie: `docker compose --env-file .env.docker ps` (app: `healthy`) i `curl -s http://127.0.0.1:3000/api/health`.

W logach aplikacji (`docker compose --env-file .env.docker logs app`) nie powinno być ostrzeżeń `APP_URL is not set` ani `ADMIN_PATH … disabled`; jeśli są, popraw `.env.docker` i ponów `up -d`.

### 3.4 Reverse proxy, HTTPS, kopie zapasowe

Wg [serwer-uczelni.md](serwer-uczelni.md): konfiguracja nginx (sekcja 1), opcjonalnie panel tylko z sieci uczelni (2), blokowanie adresów IP (3), **kopie zapasowe z cronem (4)** — ustaw je od razu, nie „później”.

### 3.5 Pierwsze kroki w panelu

`https://<adres strony>/<ADMIN_PATH>` → zaloguj się, skonfiguruj 2FA, zapisz kody zapasowe. Pulpit pokazuje listę „Do uzupełnienia” (m.in. dane kontaktowe, e-mail inspektora ochrony danych, datę publikacji deklaracji dostępności) — uzupełnij ją przed ogłoszeniem strony.

## Część 4. Obsługa na co dzień

Wszystkie polecenia z katalogu `/srv/khzios`; `dc` to skrót do dodania w `~/.bashrc`:

```bash
alias dc='docker compose --env-file .env.docker'
```

| Zadanie                                                  | Polecenie                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Stan usług                                               | `dc ps`                                                                          |
| Logi aplikacji (na żywo)                                 | `dc logs -f app` (linie JSON; błędy mają `"level":"error"`)                      |
| Restart aplikacji                                        | `dc restart app`                                                                 |
| **Aktualizacja do nowej wersji**                         | `git pull && dc up -d --build && docker image prune -f`                          |
| Aktualizacja obrazu Node/Postgres (łatki bezpieczeństwa) | `dc build --pull && dc pull db && dc up -d`                                      |
| Nowe konto panelu                                        | w panelu: Użytkownicy (administrator)                                            |
| Konto awaryjne (zgubiona 2FA jedynego administratora)    | `dc run --rm migrate pnpm admin:create --login awaryjny --name "…" --role admin` |
| Konsola bazy                                             | `dc exec db psql -U khzios -d khzios`                                            |
| Kopia teraz                                              | skrypt z [serwer-uczelni.md, sekcja 4](serwer-uczelni.md#4-kopie-zapasowe)       |
| Zmiana adresu panelu                                     | nowy `ADMIN_PATH` w `.env.docker`, potem `dc up -d`                              |

Aktualizacja zawsze nakłada migracje bazy przed startem nowej wersji (usługa `migrate`). Przed większą aktualizacją zrób kopię zapasową.

**Czego nie robić na serwerze:** `dc --profile seed run seed` (kasuje treść), `dc down -v` (kasuje bazę i pliki), ręczne zmiany w tabelach poza panelem (przy następnym zapisie panel może je nadpisać; strona i tak odświeża się raz na dobę).

### Kiedy coś nie działa

| Objaw                                                    | Co sprawdzić                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 502 z nginx                                              | `dc ps` — czy `app` działa i jest `healthy`; `dc logs app`                     |
| Aplikacja nie startuje, w logach `Invalid configuration` | brak `DATABASE_URL`/błędny `APP_URL` w konfiguracji — popraw `.env.docker`     |
| `migrate` kończy się błędem                              | `dc logs migrate`; często niezgodność zrzutu i kodu (część 2)                  |
| Panel pod adresem zwraca 404                             | `ADMIN_PATH` pusty lub błędny (ostrzeżenie w `dc logs app`)                    |
| Zmiany z panelu nie widać na stronie                     | odśwież z pominięciem cache (Ctrl+F5); strony odświeżają się po każdym zapisie |
| Zdjęcia nie wgrywają się                                 | limit `client_max_body_size 25m` w nginx; miejsce na dysku (`df -h`)           |
