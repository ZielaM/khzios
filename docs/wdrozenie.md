# Wdrożenie i utrzymanie strony

Instrukcja prowadzi od zera do opublikowanej strony na serwerze z Dockerem, a potem opisuje jej utrzymanie. Etapy są ułożone w kolejności wykonywania; każdy zaczyna się od listy tego, co trzeba mieć i skąd to wziąć. Strona staje się publiczna dopiero w [etapie 10](#etap-10-publikacja) — wcześniej nie zobaczy jej nikt, komu sam jej nie pokażesz.

Umowy w tym dokumencie:

- `[laptop]` i `[serwer]` w komentarzach mówią, gdzie wpisać polecenie.
- `dc` to skrót `docker compose --env-file .env.docker`, wpisywany w katalogu projektu (definicja w etapach 1 i 4).
- `khzios.up.poznan.pl` to docelowy adres strony, a `uzytkownik@serwer` — login i adres serwera. Podmień je na swoje.

## Kolejność prac

| Etap                                        | Co robisz                            | Co musisz mieć                        | Kto widzi stronę        |
| ------------------------------------------- | ------------------------------------ | ------------------------------------- | ----------------------- |
| [0](#etap-0-uzgodnienia-z-uczelnią)         | uzgadniasz serwer, adres, certyfikat | kontakt do informatyków uczelni       | —                       |
| [1](#etap-1-próba-u-siebie)                 | uruchamiasz stronę u siebie          | Docker na swoim komputerze            | ty (localhost)          |
| [2](#etap-2-treść-i-zrzut-danych)           | wprowadzasz treść, robisz zrzut      | dane z `dane/`, panel                 | ty (localhost)          |
| [3](#etap-3-przygotowanie-serwera)          | przygotowujesz serwer                | adres serwera, login, klucz SSH, sudo | —                       |
| [4](#etap-4-kod-i-konfiguracja)             | pobierasz kod, ustawiasz hasła       | docelowy adres strony                 | —                       |
| [5](#etap-5-budowa-i-pierwsze-uruchomienie) | budujesz i uruchamiasz               | pliki zrzutu z etapu 2                | nikt (port lokalny)     |
| [6](#etap-6-sprawdzenie-przez-tunel-ssh)    | oglądasz stronę przez tunel SSH      | —                                     | ty, przez SSH           |
| [7](#etap-7-reverse-proxy-i-https)          | stawiasz reverse proxy z HTTPS       | rekord DNS, certyfikat                | osoby z hasłem podglądu |
| [8](#etap-8-kopie-zapasowe)                 | włączasz kopie zapasowe              | miejsce na kopie poza serwerem        | osoby z hasłem podglądu |
| [9](#etap-9-kontrola-przed-publikacją)      | przechodzisz listę kontrolną         | akceptację treści                     | osoby z hasłem podglądu |
| [10](#etap-10-publikacja)                   | zdejmujesz hasło i ogłaszasz adres   | —                                     | wszyscy                 |

Potem: [utrzymanie](#utrzymanie).

## Jak to jest zbudowane

```text
internet ── HTTPS ──> reverse proxy (nginx lub Apache, porty 80 i 443)
                            │ HTTP, tylko wewnątrz serwera
                            ▼
                    127.0.0.1:3000 ── kontener app (Next.js)
                                            │ wewnętrzna sieć Dockera
                                            ▼
                                      kontener db (PostgreSQL 17)
```

`docker-compose.yml` uruchamia trzy usługi:

| Usługa    | Co robi                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------- |
| `db`      | PostgreSQL 17, dane w wolumenie `khzios_pgdata`; niedostępna spoza Dockera                          |
| `migrate` | przy każdym `up` nakłada brakujące migracje bazy i kończy działanie                                 |
| `app`     | strona (Next.js, `next start`, port 3000 w kontenerze), pliki z panelu w wolumenie `khzios_uploads` |

Komplet danych strony to **baza + wolumen `uploads`** (zdjęcia i PDF-y wgrane w panelu). Kod i obrazy Dockera można zawsze odtworzyć z repozytorium.

Aplikacja sama nie obsługuje HTTPS i nasłuchuje tylko na adresie lokalnym serwera. Do internetu wystawia ją dopiero reverse proxy (etap 7).

Konfiguracja jest w pliku `.env.docker` (wzór: `.env.docker.example`), który nie trafia do repozytorium:

| Zmienna                        | Znaczenie                                                                                                                                                                      | Skąd wziąć wartość                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `POSTGRES_PASSWORD`            | hasło bazy; tylko litery i cyfry (trafia do adresu połączenia). Działa przy pierwszym utworzeniu bazy — późniejsza zmiana ma [osobną procedurę](#zmiana-haseł-i-adresu-panelu) | `openssl rand -hex 24`                                     |
| `APP_URL`                      | publiczny adres strony; od niego zależą linki kanoniczne, sitemapa i flaga `Secure` ciasteczka panelu                                                                          | adres uzgodniony z uczelnią, z `https://`                  |
| `ADMIN_PATH`                   | adres panelu: 8–63 małe litery, cyfry i myślniki. Traktuj jak hasło. Pusty lub błędny = panel wyłączony (strona działa dalej)                                                  | `zaplecze-` + `openssl rand -hex 6`                        |
| `APP_PORT`                     | port na serwerze, na który reverse proxy kieruje ruch                                                                                                                          | zostaw `3000`, chyba że jest zajęty                        |
| `APP_BIND`                     | adres, na którym ten port jest dostępny                                                                                                                                        | zostaw `127.0.0.1`                                         |
| `POSTGRES_USER`, `POSTGRES_DB` | nazwa użytkownika i bazy                                                                                                                                                       | zostaw `khzios` (tak zakładają polecenia w tej instrukcji) |

## Etap 0. Uzgodnienia z uczelnią

**Potrzebujesz:** kontaktu do informatyków uczelni. Ten etap trwa najdłużej, więc zacznij od niego, a etapy 1–2 rób w trakcie czekania.

Zwykłe konto hostingowe (FTP i baza MySQL z phpMyAdminem, takie jak na serwerze `sparrow`) **nie wystarczy**: przez FTP można tylko wgrać pliki, a ta strona jest programem (Node.js), który musi stale działać, i używa bazy PostgreSQL, nie MySQL.

### O co poprosić

| Co                                      | Po co                                                                                     | Uwagi                                                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maszyna wirtualna z Linuksem            | tu działa strona                                                                          | Debian 12/13 lub Ubuntu LTS; 2 rdzenie, 4 GB RAM, 25 GB dysku. Sama strona zużywa ok. 300 MB RAM; 4 GB potrzebuje budowanie. Na dysku obrazy i pamięć podręczna budowania zajmują ok. 8 GB, reszta to system, zdjęcia i kopie |
| Dostęp SSH z uprawnieniami `sudo`       | instalacja Dockera i serwera WWW                                                          | albo Docker zainstalowany przez nich i twoje konto w grupie `docker`. Zapytaj też, czy SSH działa tylko z sieci uczelni lub przez VPN                                                                                         |
| Własna nazwa, np. `khzios.up.poznan.pl` | adres strony                                                                              | rekord DNS dodają informatycy. Strona **nie zadziała w podkatalogu** (`…/khzios`)                                                                                                                                             |
| Certyfikat HTTPS                        | szyfrowanie; bez niego nie da się bezpiecznie logować do panelu                           | certyfikat uczelni (dostajesz pliki albo HTTPS kończy się na ich serwerze) lub darmowy Let's Encrypt                                                                                                                          |
| Droga ruchu z internetu                 | od tego zależy konfiguracja w etapie 7                                                    | **układ A**: maszyna ma własny publiczny adres i otwarte porty 80 i 443; **układ B**: ruch przechodzi przez serwer WWW uczelni, który przekazuje go do twojej maszyny                                                         |
| Wyjście do internetu po HTTPS           | pobranie kodu z GitHuba i budowanie (Docker Hub, paczki npm i systemowe, czcionki Google) | potrzebne tylko przy budowaniu; działająca strona niczego nie pobiera. Gdy to niemożliwe → [obrazy zbudowane u siebie](#serwer-bez-internetu-lub-z-małą-pamięcią)                                                             |
| Miejsce na kopie poza tą maszyną        | kopia na tym samym dysku nie chroni przed jego awarią                                     | udział sieciowy, system kopii uczelni albo migawki maszyny wirtualnej                                                                                                                                                         |
| Zakresy adresów sieci uczelni i VPN     | opcjonalnie: panel dostępny tylko stamtąd                                                 | potrzebne dopiero w [ograniczeniu dostępu](#ograniczenie-dostępu-i-blokady)                                                                                                                                                   |

Jeśli uczelnia nie da maszyny wirtualnej, tę samą instrukcję wykonasz na wynajętym serwerze VPS — od uczelni potrzebujesz wtedy tylko rekordu DNS. Uruchomienie bez Dockera (sam Node.js i PostgreSQL) wymaga osobnej instrukcji; ta go nie opisuje.

### Wiadomość do informatyków

```text
Dzień dobry,
przygotowujemy nową stronę Katedry Hodowli Zwierząt i Oceny Surowców. Nie jest to
strona w PHP: to aplikacja Node.js z bazą PostgreSQL, dostarczana jako kontenery
Docker (docker-compose), więc konto FTP z bazą MySQL jej nie uruchomi.

Proszę o:
1. maszynę wirtualną z Linuksem (Debian lub Ubuntu LTS; 2 rdzenie, 4 GB RAM,
   25 GB dysku) z dostępem SSH i sudo albo z zainstalowanym Dockerem,
2. nazwę w domenie uczelni, np. khzios.up.poznan.pl (strona musi mieć własną
   nazwę, nie podkatalog),
3. certyfikat HTTPS dla tej nazwy albo informację, że HTTPS kończy się na
   Państwa serwerze,
4. informację, jak ruch z internetu trafi do maszyny: bezpośrednio (porty 80
   i 443) czy przez Państwa serwer WWW (wtedy proszę o jego adres IP),
5. wyjście z maszyny do internetu po HTTPS na czas budowania aplikacji,
6. wskazanie miejsca na kopie zapasowe poza tą maszyną.

Aplikacja nasłuchuje tylko lokalnie na porcie 3000, baza nie jest dostępna
z zewnątrz. Konfigurację serwera WWW mam przygotowaną dla nginx i Apache.
```

### Co przygotować u siebie

- **Klucz SSH** (jeśli go nie masz). Informatykom wysyłasz tylko plik `.pub`:
  ```bash
  # [laptop]
  ssh-keygen -t ed25519 -C "khzios"
  cat ~/.ssh/id_ed25519.pub
  ```
- **Menedżer haseł.** W trakcie wdrożenia powstanie kilka sekretów i żadnego nie da się odczytać ze strony:

  | Sekret                                   | Powstaje w | Gdzie jeszcze jest                              |
  | ---------------------------------------- | ---------- | ----------------------------------------------- |
  | hasło bazy (`POSTGRES_PASSWORD`)         | etapie 4   | `/srv/khzios/.env.docker` na serwerze           |
  | adres panelu (`ADMIN_PATH`)              | etapie 4   | `/srv/khzios/.env.docker` na serwerze           |
  | hasło konta administratora panelu        | etapie 5   | nigdzie (w bazie jest tylko hash)               |
  | kody zapasowe logowania dwuskładnikowego | etapie 6   | nigdzie (pokazywane raz)                        |
  | hasło podglądu strony przed publikacją   | etapie 7   | tylko jako skrót w `/etc/nginx/khzios.htpasswd` |

- **Aplikację uwierzytelniającą** w telefonie (dowolną z kodami TOTP, np. Google Authenticator, Microsoft Authenticator, Aegis) — panel wymaga logowania dwuskładnikowego.

## Etap 1. Próba u siebie

**Potrzebujesz:** Dockera na swoim komputerze. **Wynik:** ten sam zestaw kontenerów co na serwerze, pod `http://localhost:3000`.

1. **Docker w WSL.** Zainstaluj [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) dla Windows, potem Settings → Resources → WSL integration → włącz dla swojej dystrybucji. W terminalu WSL `docker compose version` ma odpowiadać bez błędu.
2. **Konfiguracja** w katalogu projektu:
   ```bash
   # [laptop]
   cp .env.docker.example .env.docker
   echo "alias dc='docker compose --env-file .env.docker'" >> ~/.bashrc && . ~/.bashrc
   ```
   W `.env.docker` ustaw: `POSTGRES_PASSWORD` (dowolne litery i cyfry), `APP_URL=http://localhost:3000`, `ADMIN_PATH=zaplecze-lokalny-test`.
3. **Start** (pierwsze budowanie trwa od kilku do kilkunastu minut):
   ```bash
   dc up -d --build
   dc ps -a                                     # app i db: healthy, migrate: Exited (0)
   curl -s http://localhost:3000/api/health     # {"status":"ok"}
   ```
4. **Pierwsze konto panelu** (pyta dwa razy o hasło, min. 12 znaków; wpisywanego hasła nie widać):
   ```bash
   dc run --rm migrate pnpm admin:create --login ziela --name "Imię Nazwisko" --role admin
   ```
5. Strona: <http://localhost:3000>, panel: <http://localhost:3000/zaplecze-lokalny-test>. Przy pierwszym logowaniu panel pokaże kod QR do aplikacji uwierzytelniającej i kody zapasowe.

Baza startuje **pusta** — strona działa, tylko sekcje nie mają treści. Dane przykładowe (lorem ipsum) do samego oglądania: `dc --profile seed run --rm seed` — **kasuje całą treść**, więc nie używaj tego, jeśli planujesz przenieść dane na serwer (etap 2).

Zatrzymanie: `dc down` (dane zostają). Usunięcie wszystkiego razem z danymi: `dc down -v`.

## Etap 2. Treść i zrzut danych

**Potrzebujesz:** działającego zestawu z etapu 1 i danych z folderu `dane/`. **Wynik:** dwa pliki do przeniesienia na serwer, `khzios.dump` i `uploads.tar.gz`.

Stronę wypełniasz w spokoju u siebie, a serwer od pierwszej minuty pokazuje gotową treść. Warunki:

- **Ten sam zestaw** co na serwerze (etap 1), a nie `pnpm dev` z bazą Neon: ta sama wersja PostgreSQL (17) i pliki w wolumenie Dockera, a w Neonie są dane przykładowe.
- **Czysta baza**: nie uruchamiaj seeda. Zacznij od pustej bazy i wprowadź tylko prawdziwe treści.
- **Ta sama wersja kodu** lokalnie i na serwerze (ten sam commit; sprawdzisz to w etapie 4). Zrzut zawiera tabelę `_prisma_migrations`; jeśli serwer ma nowszy kod, `migrate` doda tylko brakujące migracje, ale kod starszy niż zrzut nie zadziała.
- **Baza i pliki razem**: artykuły wskazują na zdjęcia w `uploads`. Sam zrzut bazy da stronę z niedziałającymi zdjęciami.

### 2.1 Import danych z dokumentów

Dane zebrane od zespołów (dokumenty i zdjęcia w `dane/`) są przygotowane do wczytania jednym plikiem, żeby nie przepisywać ich ręcznie w panelu:

| Plik                     | Co zawiera                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `dane/import/import.sql` | 6 zespołów, pracownicy, publikacje, projekty, przedmioty, kierownik katedry                    |
| `dane/import/media/`     | zdjęcia pracowników, przetworzone tak jak przy wgrywaniu w panelu (WebP, bez danych z aparatu) |
| `dane/BRAKI.md`          | czego w danych brakuje i co trzeba potwierdzić                                                 |

Folder `dane/` nie jest w repozytorium (dane osobowe i zdjęcia) — na inny komputer trzeba go skopiować osobno.

Import jest dla **czystej bazy**: po migracjach, bez danych przykładowych. Na bazie z seedem przerwie się z komunikatem i niczego nie zmieni. W katalogu projektu, przy działającym zestawie:

```bash
# [laptop]
# 1. Dane
dc exec -T db psql -v ON_ERROR_STOP=1 -U khzios -d khzios < dane/import/import.sql

# 2. Zdjęcia do wolumenu uploads
dc run --rm --no-deps --user root \
  -v "$PWD/dane/import/media":/import:ro --entrypoint sh app \
  -c 'cp /import/*.webp /app/uploads/ && chown -R node:node /app/uploads'

# 3. Świeży kontener aplikacji, żeby strony nie pokazywały wersji sprzed importu
dc up -d --force-recreate app
```

Pierwsze polecenie kończy się tabelką z liczbą zespołów, pracowników, publikacji, przypisań publikacji do zespołów, projektów i przedmiotów (6, 16, 95, 101, 9, 32). Przypisań jest więcej niż publikacji, bo 6 z nich należy do dwóch zespołów.

Import można powtórzyć, jeśli coś się nie wczytało: **nie zmienia** niczego, co już jest w bazie (także poprawek z panelu), ale dodaje z powrotem wszystko, czego w niej brakuje — również to, co usunąłeś w panelu. Dlatego po rozpoczęciu pracy w panelu już go nie powtarzaj, a brakujące dane (lista w `dane/BRAKI.md`) uzupełniaj w panelu, nie w plikach.

Publikacje wspólne kilku zespołów są w imporcie przypisane do każdego z nich. Jeśli dane wczytałeś wersją, w której publikacja miała jeden zespół, wczytaj jednorazowo `dane/import/upgrade-shared-publications.sql` (tym samym poleceniem co `import.sql`). Plik dopisuje drugi zespół tylko tym publikacjom, które wciąż są w zespole z pierwszego importu, i niczego nie usuwa.

Gdy jednak chcesz zmienić dane źródłowe przed pierwszym importem: popraw `dane/import/data.mjs` (zespoły, osoby, projekty, przedmioty) lub `dane/import/publications.json` i zbuduj pliki od nowa poleceniem `node dane/import/build.mjs`.

### 2.2 Reszta treści w panelu

Uzupełnij w panelu to, czego nie ma w imporcie: aktualności, ogłoszenia, dokumenty, zdjęcia stron, dane kontaktowe i ustawienia. Pulpit panelu pokazuje listę „Do uzupełnienia”.

### 2.3 Zrzut do przeniesienia

Zrób go tuż przed wdrożeniem, żeby nie przenosić nieaktualnej treści. Pierwsze polecenie usuwa dane, które nie powinny trafić na serwer: sesje, próby logowania, kosz.

```bash
# [laptop] w katalogu projektu
dc exec -T db psql -U khzios -d khzios -c \
  'TRUNCATE "AdminSession", "LoginAttempt", "SecurityEvent", "TrashItem";'

dc exec -T db pg_dump -U khzios -Fc khzios > khzios.dump
dc run --rm --no-deps -T --user root -v "$PWD":/backup --entrypoint tar app \
  czf /backup/uploads.tar.gz -C /app/uploads .

git rev-parse --short HEAD     # zapisz: z tej wersji kodu pochodzi zrzut
```

Konto administratora przenosi się razem z bazą: to samo hasło i ta sama aplikacja uwierzytelniająca zadziałają na serwerze.

Nie wysyłaj tych plików przez publiczne kanały i nie dodawaj ich do repozytorium: w bazie są hashe haseł i sekrety logowania dwuskładnikowego kont panelu.

## Etap 3. Przygotowanie serwera

**Potrzebujesz:** adresu serwera, loginu, klucza SSH i uprawnień `sudo` (etap 0). **Wynik:** serwer z Dockerem, gotowy na kod.

### 3.1 Logowanie

Przy pierwszym połączeniu SSH pyta o zaufanie do serwera — odpowiedz `yes`.

```bash
# [laptop]
ssh uzytkownik@serwer
```

### 3.2 Co dostałeś

```bash
# [serwer]
. /etc/os-release && echo "$PRETTY_NAME"            # system
nproc; free -h | sed -n '1,2p'; df -h / | tail -1   # rdzenie, pamięć, dysk
timedatectl | grep -i synchronized                  # zegar: "yes"
sudo -v && echo "sudo działa"
docker --version; docker compose version; git --version
```

Zegar musi być zsynchronizowany: kody logowania dwuskładnikowego zależą od czasu serwera. Jeśli ostatnia linia pokazuje wersje Dockera, Compose i gita, pomiń kroki 3.4 i 3.5.

### 3.3 Aktualizacja systemu

Razem z automatycznymi poprawkami bezpieczeństwa:

```bash
# [serwer]
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades     # odpowiedz "Yes"
```

### 3.4 Docker

Z oficjalnego repozytorium. Polecenia dla Debiana pochodzą z [docs.docker.com/engine/install/debian](https://docs.docker.com/engine/install/debian/); dla Ubuntu użyj [strony dla Ubuntu](https://docs.docker.com/engine/install/ubuntu/), bo różnią się adresem repozytorium.

```bash
# [serwer]
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Potem dodaj swoje konto do grupy `docker` (to w praktyce uprawnienia administratora na tej maszynie), **wyloguj się i zaloguj ponownie**, i sprawdź:

```bash
# [serwer]
sudo usermod -aG docker "$USER"
# po ponownym zalogowaniu:
docker run --rm hello-world          # "Hello from Docker!"
systemctl is-enabled docker          # "enabled": kontenery wstaną po restarcie serwera
```

### 3.5 Git

```bash
# [serwer]
sudo apt install -y git
```

### 3.6 Zapora

Tylko w układzie A (maszyna z własnym publicznym adresem) i tylko jeśli uczelnia nie filtruje ruchu sama; zapytaj o to. Najpierw SSH, inaczej odetniesz sobie dostęp:

```bash
# [serwer]
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable && sudo ufw status
```

Uwaga: `ufw` **nie obejmuje portów wystawianych przez Dockera**. Tu to nie przeszkadza, bo aplikacja jest wystawiona tylko na `127.0.0.1`, a baza wcale — ale nie zmieniaj `APP_BIND` w przekonaniu, że zapora zasłoni port.

## Etap 4. Kod i konfiguracja

**Potrzebujesz:** docelowego adresu strony (etap 0). **Wynik:** katalog `/srv/khzios` z kodem i plikiem `.env.docker`.

```bash
# [serwer]
sudo mkdir -p /srv/khzios && sudo chown "$USER": /srv/khzios
git clone https://github.com/ZielaM/khzios.git /srv/khzios     # repozytorium jest publiczne, konto niepotrzebne
cd /srv/khzios
git log -1 --format='%h %s'          # ta sama wersja, z której pochodzi zrzut (etap 2.3)?

cp .env.docker.example .env.docker
chmod 600 .env.docker                # hasło bazy i adres panelu
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
echo "ADMIN_PATH=zaplecze-$(openssl rand -hex 6)"
nano .env.docker                     # wklej obie wartości, ustaw APP_URL

echo "alias dc='docker compose --env-file .env.docker'" >> ~/.bashrc && . ~/.bashrc
```

Gotowy plik wygląda tak (obie wylosowane wartości zapisz też w menedżerze haseł):

```ini
POSTGRES_USER=khzios
POSTGRES_PASSWORD=4c1d…          # 48 znaków z openssl
POSTGRES_DB=khzios
APP_URL=https://khzios.up.poznan.pl
APP_PORT=3000
APP_BIND=127.0.0.1
ADMIN_PATH=zaplecze-3f9a1c2b7d4e
```

- `APP_URL` ustaw od razu na docelowy adres z `https://`, nawet jeśli nazwa jeszcze nie działa.
- Hasło bazy na serwerze może być inne niż u ciebie lokalnie: zrzut go nie przenosi.
- Jeśli kod na serwerze jest nowszy niż ten, z którego pochodzi zrzut, to w porządku (migracje się dołożą). Jeśli starszy — wróć do etapu 2.3 i zrób zrzut z właściwej wersji albo zaktualizuj kod.

### Serwer bez internetu lub z małą pamięcią

Gdy serwer nie ma wyjścia do internetu albo ma mniej niż 4 GB RAM, zbuduj obrazy u siebie i prześlij gotowe. Serwer potrzebuje wtedy tylko Dockera (bez gita).

```bash
# [laptop] w katalogu projektu, na wersji, którą wdrażasz
dc build
docker save khzios-app khzios-migrate postgres:17-alpine | gzip > khzios-images.tar.gz     # ok. 0,9 GB
scp khzios-images.tar.gz docker-compose.yml .env.docker.example uzytkownik@serwer:/srv/khzios/

# [serwer]
cd /srv/khzios
docker load -i khzios-images.tar.gz
```

Plik `.env.docker` przygotuj jak wyżej. W dalszych etapach pomijaj `dc build`, a zamiast `dc up -d --build` pisz `dc up -d --no-build`. Każdą aktualizację strony robisz wtedy tak samo: budujesz u siebie, przesyłasz obrazy, `docker load`, `dc up -d --no-build`.

## Etap 5. Budowa i pierwsze uruchomienie

**Potrzebujesz:** plików `khzios.dump` i `uploads.tar.gz` z etapu 2 (albo decyzji, że zaczynasz od pustej strony). **Wynik:** działająca strona, dostępna tylko z samego serwera.

### Wariant z danymi przygotowanymi u siebie (zalecany)

```bash
# [laptop] w katalogu projektu
scp khzios.dump uploads.tar.gz uzytkownik@serwer:/srv/khzios/

# [serwer]
cd /srv/khzios
dc build                                 # od kilku do kilkunastu minut
dc up -d --wait db                       # sama baza; --wait czeka, aż będzie gotowa
dc exec -T db pg_restore -U khzios -d khzios --no-owner --clean --if-exists < khzios.dump
dc run --rm --no-deps --user root -v "$PWD":/backup:ro --entrypoint tar app \
  xzf /backup/uploads.tar.gz -C /app/uploads
dc run --rm --no-deps --user root --entrypoint chown app -R node:node /app/uploads
dc up -d                                 # migracje i aplikacja

rm khzios.dump uploads.tar.gz            # zawierają hashe haseł; na serwerze już niepotrzebne
```

`chown` oddaje pliki użytkownikowi, na którym działa aplikacja (bez tego nie mogłaby usuwać zdjęć).

### Wariant z pustą stroną

```bash
# [serwer]
cd /srv/khzios
dc up -d --build
dc run --rm migrate pnpm admin:create --login ziela --name "Imię Nazwisko" --role admin
```

Treść wprowadzasz wtedy na serwerze przez panel (od etapu 6), a zebrane dane możesz wczytać importem: skopiuj `dane/import/` na serwer (`scp -r dane/import uzytkownik@serwer:/srv/khzios/dane/`) i wykonaj trzy polecenia z [etapu 2.1](#21-import-danych-z-dokumentów). Nie ma wtedy przenoszenia zrzutu ani zgodności wersji do pilnowania.

### Sprawdzenie

```bash
# [serwer]
dc ps -a                                         # app i db: healthy, migrate: Exited (0)
curl -s http://127.0.0.1:3000/api/health         # {"status":"ok"}
dc logs app | grep -E '"level":"(warn|error)"'   # nic nie wypisuje
```

Ostrzeżenia `APP_URL is not set` albo `ADMIN_PATH … the admin panel is disabled` oznaczają błąd w `.env.docker`: popraw plik i wykonaj `dc up -d`.

Strona działa, ale z zewnątrz jej nie widać: port 3000 jest dostępny tylko z samego serwera. Sprawdź to ze swojego komputera — polecenie ma się zakończyć błędem połączenia:

```bash
# [laptop]
curl -m 5 http://ADRES_IP_SERWERA:3000/
```

## Etap 6. Sprawdzenie przez tunel SSH

**Potrzebujesz:** tylko dostępu SSH. **Wynik:** widzisz stronę z serwera w swojej przeglądarce, zanim zobaczy ją ktokolwiek inny.

```bash
# [laptop] zostaw to okno otwarte; Ctrl+C kończy tunel
ssh -N -L 3000:127.0.0.1:3000 uzytkownik@serwer
```

Strona jest teraz pod <http://localhost:3000>, a panel pod `http://localhost:3000/<ADMIN_PATH>`. Jeśli port 3000 masz zajęty lokalnie, napisz `-L 3001:127.0.0.1:3000` i otwórz `localhost:3001`.

- Do panelu przez tunel loguj się w **Chrome, Edge lub Firefoksie**. Safari odrzuca ciasteczko sesji na nieszyfrowanym `localhost`, więc logowanie w nim nie zadziała (po uruchomieniu HTTPS w etapie 7 działa wszędzie).
- Pierwsze logowanie: hasło, potem kod QR do aplikacji uwierzytelniającej i **kody zapasowe** — zapisz je w menedżerze haseł, panel pokazuje je tylko raz.
- Obejrzyj wszystkie wersje językowe, zdjęcia i dokumenty. Linki kanoniczne w źródle strony wskazują już docelowy adres — tak ma być.

## Etap 7. Reverse proxy i HTTPS

**Potrzebujesz:** rekordu DNS dla nazwy strony, certyfikatu HTTPS (albo zgody na Let's Encrypt) i odpowiedzi, czy to układ A czy B (wszystko z etapu 0). **Wynik:** strona pod docelowym adresem przez HTTPS, zamknięta hasłem podglądu.

**Kiedy:** teraz — gdy aplikacja działa i obejrzałeś ją przez tunel. Wcześniej proxy nie ma czego pokazywać (zwróci błąd 502).

**Dlaczego od razu z hasłem:** z chwilą skonfigurowania proxy stronę może otworzyć każdy, kto zna adres, a wydanie certyfikatu trafia do publicznych rejestrów, które roboty przeglądają na bieżąco. Hasło podglądu sprawia, że do dnia publikacji nikt niepowołany nie zobaczy strony, a wyszukiwarki jej nie zaindeksują.

**Gdzie:**

- **Układ A** — maszyna ma własny publiczny adres: nginx na tej maszynie odbiera HTTPS i przekazuje ruch do aplikacji.
- **Układ B** — ruch przechodzi przez serwer WWW uczelni: HTTPS kończy się u nich, a nginx na twojej maszynie odbiera od nich zwykły HTTP. Dzięki własnemu nginx hasło podglądu, limity i moment publikacji zostają w twoich rękach.

### 7.1 Nginx i hasło podglądu (oba układy)

```bash
# [serwer]
sudo apt install -y nginx apache2-utils
nginx -v
sudo htpasswd -c /etc/nginx/khzios.htpasswd podglad     # zapyta o hasło podglądu; login: podglad
```

Hasło podglądu przekażesz osobom, które mają obejrzeć stronę przed publikacją.

### 7.2 Certyfikat (tylko układ A)

**Certyfikat od uczelni:** dostajesz plik certyfikatu z łańcuchem i plik klucza. Umieść je na serwerze:

```bash
# [serwer]
sudo install -m 644 certyfikat-z-lancuchem.pem /etc/ssl/certs/khzios.pem
sudo install -m 600 klucz.key /etc/ssl/private/khzios.key
openssl x509 -in /etc/ssl/certs/khzios.pem -noout -subject -enddate     # nazwa i data ważności
```

Datę ważności wpisz do kalendarza z miesięcznym wyprzedzeniem.

**Let's Encrypt:** nazwa strony musi już wskazywać na serwer (`nslookup khzios.up.poznan.pl`), a port 80 musi być osiągalny z internetu. Zrób to przed krokiem 7.3, gdy nginx ma jeszcze domyślną konfigurację:

```bash
# [serwer]
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d khzios.up.poznan.pl --deploy-hook "systemctl reload nginx"
```

Odnawianie jest potem automatyczne; jego próbę wykonasz w kroku 7.4, już z docelową konfiguracją.

W konfiguracji z kroku 7.3 wpisz wtedy ścieżki `/etc/letsencrypt/live/khzios.up.poznan.pl/fullchain.pem` i `…/privkey.pem`.

### 7.3 Konfiguracja nginx

**Układ A.** Plik `/etc/nginx/sites-available/khzios`:

```nginx
server {
    listen 80;
    server_name khzios.up.poznan.pl;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name khzios.up.poznan.pl;

    ssl_certificate     /etc/ssl/certs/khzios.pem;
    ssl_certificate_key /etc/ssl/private/khzios.key;

    # Wgrywanie zdjęć i PDF-ów w panelu
    client_max_body_size 25m;

    # DO DNIA PUBLIKACJI: cała strona za hasłem podglądu (etap 10 usuwa te dwie linie)
    auth_basic           "Strona w przygotowaniu";
    auth_basic_user_file /etc/nginx/khzios.htpasswd;

    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Dyrektywa `http2 on;` wymaga nginx 1.25.1 lub nowszego (Debian 13). Na starszym (Debian 12, Ubuntu 24.04) nginx zgłosi `unknown directive "http2"` — usuń wtedy tę linię i napisz `listen 443 ssl http2;`.

**Układ B.** Plik `/etc/nginx/sites-available/khzios` — bez certyfikatu, za to z adresem proxy uczelni:

```nginx
server {
    listen 80;
    server_name khzios.up.poznan.pl;

    # Adres odwiedzającego podaje proxy uczelni; ufamy tylko jemu
    set_real_ip_from 192.0.2.10;
    real_ip_header   X-Forwarded-For;

    # Wgrywanie zdjęć i PDF-ów w panelu
    client_max_body_size 25m;

    # DO DNIA PUBLIKACJI: cała strona za hasłem podglądu (etap 10 usuwa te dwie linie)
    auth_basic           "Strona w przygotowaniu";
    auth_basic_user_file /etc/nginx/khzios.htpasswd;

    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

W miejsce `192.0.2.10` wpisz adres IP serwera WWW uczelni. Bez tych dwóch linii każdy odwiedzający wyglądałby dla aplikacji jak ten jeden serwer: dziennik logowań byłby bezużyteczny, a limit nieudanych logowań z jednego adresu blokowałby wszystkich naraz. W zaporze wpuść na port 80 tylko ten serwer: `sudo ufw allow from 192.0.2.10 to any port 80 proto tcp`.

Informatykom przekaż, czego ich serwer ma dopilnować: przekierowania HTTP → HTTPS, niezmienionego nagłówka `Host`, dopisywania adresu klienta do `X-Forwarded-For` (Apache i nginx robią to domyślnie) i limitu rozmiaru żądania co najmniej 25 MB. Dla Apache to:

```apache
# Wymagane moduły: a2enmod ssl proxy proxy_http headers
<VirtualHost *:80>
    ServerName khzios.up.poznan.pl
    Redirect permanent / https://khzios.up.poznan.pl/
</VirtualHost>

<VirtualHost *:443>
    ServerName khzios.up.poznan.pl

    SSLEngine on
    SSLCertificateFile    /etc/ssl/certs/khzios.pem
    SSLCertificateKeyFile /etc/ssl/private/khzios.key

    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    ProxyPass        / http://ADRES_MASZYNY_ZE_STRONA:80/
    ProxyPassReverse / http://ADRES_MASZYNY_ZE_STRONA:80/
    ProxyTimeout 60
</VirtualHost>
```

**Włączenie (oba układy):**

```bash
# [serwer]
sudo ln -s /etc/nginx/sites-available/khzios /etc/nginx/sites-enabled/khzios
sudo rm /etc/nginx/sites-enabled/default        # powitalna strona nginx
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` sprawdza konfigurację; przy błędzie nginx działa dalej na starej, więc najpierw popraw plik.

### 7.4 Sprawdzenie

```bash
# [laptop]
curl -sI http://khzios.up.poznan.pl/ | head -3              # 301 i Location: https://…
curl -sI https://khzios.up.poznan.pl/ | head -1             # 401: wymaga hasła podglądu
curl -sI -u podglad https://khzios.up.poznan.pl/pl | head -1    # zapyta o hasło; 200
curl -m 5 http://ADRES_IP_SERWERA:3000/                     # nadal błąd połączenia
```

W przeglądarce:

- Otwórz `https://khzios.up.poznan.pl`: kłódka bez ostrzeżeń, przeglądarka pyta o hasło podglądu, strona się wyświetla.
- Zaloguj się do panelu (`https://khzios.up.poznan.pl/<ADMIN_PATH>`) — teraz już w dowolnej przeglądarce.
- W panelu otwórz **Dziennik → Logowania**: przy twoim logowaniu ma być twój publiczny adres IP. Jeśli jest tam `127.0.0.1` albo adres serwera uczelni, proxy nie przekazuje adresów — w układzie B sprawdź linie `set_real_ip_from` i `real_ip_header`.
- Wgraj w panelu zdjęcie o rozmiarze kilku–kilkunastu MB. Błąd 413 oznacza brak `client_max_body_size` (albo zbyt niski limit na serwerze uczelni).

Przy certyfikacie Let's Encrypt sprawdź jeszcze na serwerze, że odnawianie działa z docelową konfiguracją: `sudo certbot renew --dry-run` ma się zakończyć komunikatem o powodzeniu.

Gdy nazwa strony jeszcze nie działa w DNS, a chcesz już testować: dopisz na swoim komputerze linię `ADRES_IP_SERWERA khzios.up.poznan.pl` do pliku `/etc/hosts` (Windows: `C:\Windows\System32\drivers\etc\hosts`). Usuń ją po testach.

## Etap 8. Kopie zapasowe

**Potrzebujesz:** miejsca na kopie poza serwerem (etap 0). **Wynik:** codzienna kopia bazy i plików oraz sprawdzone odtwarzanie. Zrób to **przed publikacją**, nie „później”.

### 8.1 Skrypt

Zapisz jako `/usr/local/bin/khzios-backup` (`sudo nano /usr/local/bin/khzios-backup`); pierwsza linia pliku to `#!/bin/sh`, bez spacji przed nią:

```sh
#!/bin/sh
# /usr/local/bin/khzios-backup: kopia bazy i plików wgranych w panelu
set -eu
cd /srv/khzios                 # katalog z docker-compose.yml i .env.docker
DEST=/var/backups/khzios
DATE=$(date +%F)
umask 077                      # w kopii są hashe haseł i sekrety 2FA
mkdir -p "$DEST"

# Baza. Najpierw plik tymczasowy: przerwany zrzut nie może udawać dobrej kopii
docker compose --env-file .env.docker exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$DEST/db-$DATE.dump.tmp"
mv "$DEST/db-$DATE.dump.tmp" "$DEST/db-$DATE.dump"

# Pliki z wolumenu uploads, przez obraz aplikacji (działa też, gdy strona stoi)
docker compose --env-file .env.docker run --rm --no-deps -T --user root \
  -v "$DEST":/backup --entrypoint tar app \
  czf "/backup/uploads-$DATE.tar.gz" -C /app/uploads .

# Kopie starsze niż 30 dni
find "$DEST" -type f -mtime +30 -delete
echo "$(date '+%F %T') kopia gotowa, katalog zajmuje $(du -sh "$DEST" | cut -f1)"
```

### 8.2 Pierwsze uruchomienie

```bash
# [serwer]
sudo chmod 700 /usr/local/bin/khzios-backup
sudo /usr/local/bin/khzios-backup
sudo ls -lh /var/backups/khzios        # db-RRRR-MM-DD.dump i uploads-RRRR-MM-DD.tar.gz, oba niepuste
```

### 8.3 Codziennie o 3:00

Plik `/etc/cron.d/khzios-backup` (`sudo nano /etc/cron.d/khzios-backup`) z jedną linią, zakończoną Enterem:

```text
0 3 * * * root /usr/local/bin/khzios-backup >> /var/log/khzios-backup.log 2>&1
```

Następnego dnia sprawdź `sudo tail -2 /var/log/khzios-backup.log` i datę plików w `/var/backups/khzios`.

### 8.4 Kopia poza serwerem

Uzgodnij z informatykami automatyczne kopiowanie katalogu `/var/backups/khzios` (albo migawki całej maszyny). Dopóki tego nie ma, raz w miesiącu pobieraj kopię ręcznie:

```bash
# [serwer] udostępnij dzisiejszą kopię swojemu kontu (nocna powstaje o 3:00)
D=$(date +%F)
sudo cp /var/backups/khzios/db-$D.dump /var/backups/khzios/uploads-$D.tar.gz ~/
sudo chown "$USER": ~/db-$D.dump ~/uploads-$D.tar.gz

# [laptop]
D=$(date +%F); mkdir -p ~/kopie-khzios
scp "uzytkownik@serwer:db-$D.dump" "uzytkownik@serwer:uploads-$D.tar.gz" ~/kopie-khzios/

# [serwer] w tym samym oknie co pierwszy krok
rm ~/db-$D.dump ~/uploads-$D.tar.gz
```

### 8.5 Próba odtworzenia

Kopia, której nikt nie odtworzył, nie jest sprawdzona. Wczytaj pobrane pliki do zestawu na swoim komputerze według procedury [Odtwarzanie z kopii](#odtwarzanie-z-kopii) i obejrzyj stronę pod `localhost:3000`.

## Etap 9. Kontrola przed publikacją

**Potrzebujesz:** akceptacji treści od kierownika katedry. Przejdź listę w całości; każdy niezaznaczony punkt to powód, żeby jeszcze nie publikować.

Treść:

- [ ] Pulpit panelu nie pokazuje listy „Do uzupełnienia” (poza datą publikacji strony, którą wpisuje się w dniu publikacji).
- [ ] Braki z `dane/BRAKI.md` są uzupełnione albo świadomie odłożone.
- [ ] Każda wersja językowa (pl, en, uk, ru) obejrzana: strona główna, O nas, struktura i zespoły, aktualności, strefa studenta, kontakt.
- [ ] Nie ma treści próbnych ani przykładowych (lorem ipsum, testowe aktualności).
- [ ] Polityka prywatności i deklaracja dostępności mają prawdziwe dane (Ustawienia w panelu) i zostały przeczytane przez osobę odpowiedzialną na uczelni.
- [ ] Treść zaakceptował kierownik katedry.

Technika:

- [ ] `https://` działa bez ostrzeżeń, `http://` przekierowuje na `https://`.
- [ ] `curl -s -u podglad https://khzios.up.poznan.pl/robots.txt` pokazuje `Sitemap:` z docelowym adresem (czyli `APP_URL` jest poprawny).
- [ ] `dc ps -a` pokazuje `healthy`, a `dc logs app | grep -E '"level":"(warn|error)"'` nic nie wypisuje.
- [ ] Panel → Użytkownicy: tylko prawdziwe konta, żadne nie ma znacznika „bez 2FA”, jest **drugi administrator** (inna osoba).
- [ ] Dziennik → Logowania pokazuje prawdziwe adresy IP.
- [ ] Kopia zapasowa wykonała się sama z crona, jedna kopia jest poza serwerem, próba odtworzenia się udała (etap 8).
- [ ] Po `sudo reboot` strona wraca sama w ciągu 1–2 minut (`dc ps -a`).
- [ ] `curl -m 5 http://ADRES_IP_SERWERA:3000/` z twojego komputera kończy się błędem połączenia.
- [ ] Strona obejrzana na telefonie i w drugiej przeglądarce.
- [ ] Hasło bazy, adres panelu, hasło administratora i kody zapasowe są w menedżerze haseł.

Organizacja:

- [ ] Ustalony dzień publikacji i osoba, która doda odnośnik na stronach uczelni lub wydziału.
- [ ] Wiadomo, co z dotychczasową stroną katedry (odnośnik lub przekierowanie na nową).
- [ ] Wersja demonstracyjna na Vercelu, jeśli nadal działa, jest usunięta lub zabezpieczona: zawiera treści przykładowe i jest publiczna.

## Etap 10. Publikacja

Stronę publikuje jedna czynność: **zdjęcie hasła podglądu** (krok 3). Wszystko przed nią da się cofnąć bez śladu; po niej strona jest widoczna dla ludzi i wyszukiwarek.

1. **Kopia zapasowa** stanu, który publikujesz: `sudo /usr/local/bin/khzios-backup`.
2. **Daty w panelu** (Ustawienia): w deklaracji dostępności „Data publikacji strony” = dzisiejsza data; sprawdź też „Sporządzenie deklaracji” i „Data aktualizacji polityki”.
3. **Zdejmij hasło podglądu.** W `/etc/nginx/sites-available/khzios` usuń dwie linie `auth_basic…`, a w ich miejsce wpisz:
   ```nginx
       add_header Strict-Transport-Security "max-age=31536000" always;
   ```
   Ten nagłówek każe przeglądarkom przez rok łączyć się ze stroną tylko przez HTTPS, dlatego dodajesz go dopiero teraz, gdy certyfikat działa. Potem:
   ```bash
   # [serwer]
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **Sprawdź z okna prywatnego przeglądarki**, że strona otwiera się bez pytania o hasło, a `https://khzios.up.poznan.pl/robots.txt` i `/sitemap.xml` odpowiadają.
5. **Rozgłoś adres** — dopiero teraz:
   - **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console)): dodaj usługę typu „Prefiks adresu URL”, potwierdź własność i zgłoś mapę witryny `https://khzios.up.poznan.pl/sitemap.xml`. Własność najprościej potwierdzić plikiem HTML — bez zmian w kodzie, jedną regułą w nginx (nazwę pliku podaje Google), wpisaną w bloku `server` obok `location /`:
     ```nginx
         location = /google1234567890abcdef.html {
             default_type text/html;
             return 200 "google-site-verification: google1234567890abcdef.html";
         }
     ```
     Alternatywa: rekord TXT w DNS dodany przez informatyków.
   - Poproś o odnośnik na stronach uczelni i wydziału oraz o odnośnik lub przekierowanie z dotychczasowej strony katedry.
   - Poinformuj pracowników i studentów.
6. **Przez pierwsze dni** zaglądaj do logów (`dc logs --since 24h app | grep '"level":"error"'`) i do Dziennika w panelu. Po 1–2 tygodniach sprawdź w Google `site:khzios.up.poznan.pl`.

**Gdy coś opublikowało się za wcześnie:** przywróć dwie linie `auth_basic…` i przeładuj nginx — strona od razu znów wymaga hasła. Jeśli wyszukiwarka zdążyła coś zaindeksować, w Search Console jest narzędzie „Usunięcia”.

## Utrzymanie

Serwer **nie aktualizuje się sam** po zmianach w repozytorium: nowa wersja trafia na stronę dopiero, gdy wykonasz [aktualizację](#aktualizacja-strony). Wszystkie polecenia poniżej wpisuje się na serwerze, w katalogu `/srv/khzios`.

### Co gdzie jest

| Co                       | Gdzie                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Kod                      | repozytorium na GitHubie; na serwerze `/srv/khzios`                                     |
| Konfiguracja i sekrety   | `/srv/khzios/.env.docker` (kopia wartości w menedżerze haseł)                           |
| Baza i wgrane pliki      | wolumeny Dockera `khzios_pgdata` i `khzios_uploads`                                     |
| Kopie zapasowe           | `/var/backups/khzios` (30 dni) i miejsce poza serwerem                                  |
| Konfiguracja serwera WWW | `/etc/nginx/sites-available/khzios`, certyfikat w `/etc/ssl/` lub `/etc/letsencrypt/`   |
| Logi aplikacji           | `dc logs app` (Docker trzyma najwyżej 50 MB na kontener)                                |
| Logi serwera WWW i kopii | `/var/log/nginx/`, `/var/log/khzios-backup.log`                                         |
| Dziennik zmian i logowań | panel → Dziennik (logowania i podejrzane zapytania starsze niż 90 dni usuwają się same) |
| Usunięte treści          | panel → Kosz (30 dni, potem usuwają się same)                                           |

### Kalendarz

**Dzieje się samo:** nocna kopia zapasowa, poprawki bezpieczeństwa systemu, odnawianie certyfikatu Let's Encrypt, ograniczanie rozmiaru logów, czyszczenie kosza i dziennika.

**Co tydzień (5 minut):**

```bash
# [serwer]
cd /srv/khzios
dc ps -a                                              # app i db: healthy
curl -s https://khzios.up.poznan.pl/api/health        # {"status":"ok"}
df -h / | tail -1                                     # zajętość dysku poniżej 80%
sudo ls -lh /var/backups/khzios | tail -4             # jest kopia z ostatniej nocy, pliki niepuste
dc logs --since 168h app | grep -c '"level":"error"'  # 0; inaczej przeczytaj te linie
```

Do tego zakładka Pull requests na GitHubie: poprawki bezpieczeństwa od Dependabota scal po przejściu testów i wdróż od razu.

**Co miesiąc (pół godziny, wieczorem):**

- [aktualizacja strony](#aktualizacja-strony), jeśli w gałęzi `main` są nowe zmiany,
- [aktualizacja systemu i obrazów](#aktualizacje-systemu-i-obrazów),
- pobranie kopii zapasowej poza serwer ([etap 8.4](#84-kopia-poza-serwerem)), jeśli nie dzieje się to automatycznie,
- panel → Dziennik → Logowania i Podejrzane zapytania: czy nie ma serii nieudanych logowań na istniejące konta.

**Co kwartał:**

- próba odtworzenia kopii u siebie ([Odtwarzanie z kopii](#odtwarzanie-z-kopii)),
- panel → Użytkownicy: zablokuj konta osób, które już nie pracują przy stronie,
- data ważności certyfikatu: `echo | openssl s_client -connect khzios.up.poznan.pl:443 2>/dev/null | openssl x509 -noout -enddate`,
- [miejsce na dysku](#miejsce-na-dysku).

**Co rok:**

- **do 31 marca** — przegląd deklaracji dostępności (obowiązek ustawowy); po przeglądzie wpisz datę w panelu: Ustawienia → „Ostatni przegląd deklaracji”,
- sprawdzenie polityki prywatności i danych kontaktowych,
- wersje z końcem wsparcia: **Node.js 22 do kwietnia 2027** (przed tą datą zmień `FROM node:22-alpine` w `Dockerfile` na kolejną wersję LTS — Dependabot celowo tego nie proponuje), PostgreSQL 17 do listopada 2029, wydanie systemu na serwerze,
- przejrzenie tej instrukcji i listy osób z dostępem.

### Aktualizacja strony

Warunek: zmiany są scalone do `main` i testy na GitHubie przeszły. Przy zmianie wersji Next.js przeczytaj najpierw [aktualizacja-nextjs.md](aktualizacja-nextjs.md).

```bash
# [serwer]
cd /srv/khzios
git rev-parse --short HEAD               # zapisz: wersja przed aktualizacją
sudo /usr/local/bin/khzios-backup        # kopia przed zmianą
git pull
dc up -d --build
dc ps -a && curl -s http://127.0.0.1:3000/api/health
dc logs --since 10m app | grep -E '"level":"(warn|error)"'
docker image prune -f                    # usuwa poprzednie obrazy
```

W czasie budowania strona działa na starej wersji; przerwa to kilka sekund przy podmianie kontenera. Usługa `migrate` nakłada zmiany w bazie przed startem nowej wersji. Po aktualizacji otwórz stronę i zaloguj się do panelu.

### Wycofanie aktualizacji

Gdy nowa wersja nie działa, wróć do zapisanej:

```bash
# [serwer]
cd /srv/khzios
git checkout ZAPISANA_WERSJA
dc up -d --build
```

Jeśli aktualizacja zmieniała bazę (`git diff --stat ZAPISANA_WERSJA main -- prisma/migrations` coś wypisuje), stary kod może nie działać z nową bazą — odtwórz wtedy kopię zrobioną przed aktualizacją ([Odtwarzanie z kopii](#odtwarzanie-z-kopii)); treści dodane po niej przepadną. Po naprawieniu błędu w repozytorium wróć na główną gałąź: `git checkout main && git pull && dc up -d --build`.

### Aktualizacje systemu i obrazów

```bash
# [serwer]
sudo apt update && sudo apt upgrade -y          # aktualizacja Dockera na chwilę zatrzymuje stronę
[ -f /var/run/reboot-required ] && echo "wymagany restart: sudo reboot"

cd /srv/khzios
dc build --pull && dc pull db && dc up -d       # łatki obrazów Node i PostgreSQL 17
docker image prune -f
```

Po restarcie serwera kontenery wstają same; sprawdź `dc ps -a`. Gdyby nie wstały: `dc up -d`.

Zmiana **głównej** wersji PostgreSQL (17 → 18) to nie jest zmiana jednej cyfry w `docker-compose.yml`: nowa wersja nie uruchomi się na starym katalogu danych. Bezpieczna droga to kopia, nowy pusty wolumen z nową wersją i odtworzenie kopii — przećwiczone najpierw u siebie.

### Odtwarzanie z kopii

Przywraca bazę i pliki do stanu z wybranego dnia. **Obecna zawartość bazy i plików zostaje zastąpiona.** Jeśli odtwarzasz z dzisiejszej kopii, nie uruchamiaj wcześniej `khzios-backup` — nadpisałby ją obecnym stanem.

```bash
# [serwer]
cd /srv/khzios
KOPIA=/var/backups/khzios
DZIEN=2026-10-01                          # data kopii

dc stop app
dc exec -T db sh -c 'psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
sudo cat "$KOPIA/db-$DZIEN.dump" | dc exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner'
dc run --rm --no-deps --user root -v "$KOPIA":/backup:ro --entrypoint sh app \
  -c "rm -rf /app/uploads/* && tar xzf /backup/uploads-$DZIEN.tar.gz -C /app/uploads && chown -R node:node /app/uploads"
dc up -d --force-recreate app
```

Ostatnie polecenie tworzy **nowy** kontener aplikacji — samo `dc start app` zostawiłoby strony zapamiętane sprzed odtworzenia. Kod powinien być w tej samej lub nowszej wersji niż w dniu kopii.

Na swoim komputerze (próba odtworzenia) robisz to samo w katalogu projektu, przy działającym zestawie (`dc up -d`), z `KOPIA=$HOME/kopie-khzios` i bez `sudo`; zastępuje to treść lokalnego zestawu.

### Przeniesienie na inny serwer

Także odbudowa po utracie serwera. Na nowej maszynie wykonaj etapy 3–5, biorąc jako zrzut najnowszą kopię zapasową (`db-RRRR-MM-DD.dump` zamiast `khzios.dump`, `uploads-RRRR-MM-DD.tar.gz` zamiast `uploads.tar.gz`), potem etapy 7 i 8. Wartości z `.env.docker` weź z menedżera haseł; adres panelu możesz zostawić ten sam. Na końcu informatycy przełączają rekord DNS (albo adres w swoim proxy) na nową maszynę.

### Konta panelu

- **Nowe konto:** panel → Użytkownicy → Nowe konto (tylko administrator). Panel pokazuje hasło tymczasowe — przekaż je osobiście. Przy pierwszym logowaniu trzeba je zmienić i włączyć logowanie dwuskładnikowe.
- **Role:** redaktor edytuje treści; administrator dodatkowo zarządza kontami, ustawieniami i dziennikiem. Zawsze miej **dwóch administratorów**.
- **Ktoś odchodzi:** zablokuj konto (zostaje wylogowane od razu). Kont się nie usuwa, żeby dziennik zmian pozostał czytelny.
- **Zapomniane hasło lub zgubiony telefon:** administrator w Użytkownikach nadaje nowe hasło tymczasowe albo resetuje logowanie dwuskładnikowe. Samemu można użyć kodu zapasowego, a nowe kody wygenerować w Moim koncie.
- **Nikt nie może się zalogować** (jedyny administrator stracił telefon i kody): załóż konto awaryjne z serwera, zaloguj się nim i napraw właściwe konto.
  ```bash
  # [serwer]
  dc run --rm migrate pnpm admin:create --login awaryjny --name "Konto awaryjne" --role admin
  ```
- **Zabezpieczenia wbudowane:** logowanie wstrzymuje się na kilkanaście minut po 5 nieudanych próbach na jeden login lub 20 z jednego adresu w ciągu 15 minut; sesja wygasa po 30 minutach bezczynności i najpóźniej po 8 godzinach.

### Zmiana haseł i adresu panelu

**Adres panelu** (gdy mógł wyciec): wpisz nowy `ADMIN_PATH` w `.env.docker`, wykonaj `dc up -d`, przekaż adres użytkownikom. Jeśli w nginx jest blok ograniczający panel, zmień adres także tam.

**Hasło bazy.** Sama zmiana w pliku nie wystarczy — baza zna stare hasło, `migrate` zakończy się błędem `P1000` i strona nie wstanie. Kolejność:

```bash
# [serwer]
cd /srv/khzios
NOWE=$(openssl rand -hex 24); echo "$NOWE"
dc exec -T db psql -U khzios -d khzios -c "ALTER ROLE khzios PASSWORD '$NOWE';"
nano .env.docker                 # wpisz to samo hasło w POSTGRES_PASSWORD
dc up -d
```

**Certyfikat od uczelni:** podmień pliki z kroku 7.2 pod tymi samymi nazwami i wykonaj `sudo nginx -t && sudo systemctl reload nginx`.

### Ograniczenie dostępu i blokady

Panel chroni hasło, drugi składnik i limit prób, więc poniższe to dodatkowe warstwy, nie warunek bezpieczeństwa.

**Panel tylko z sieci uczelni lub VPN.** W bloku `server`, obok `location /` (adres panelu to wartość `ADMIN_PATH`; zakresy podają informatycy):

```nginx
    location /zaplecze-3f9a1c2b7d4e {
        allow 192.0.2.0/24;
        allow 198.51.100.0/24;
        deny  all;
        limit_req zone=khzios_admin burst=60 nodelay;
        proxy_pass http://127.0.0.1:3000;
    }
```

Linia `limit_req` ogranicza tempo żądań do panelu i wymaga definicji strefy w pliku `/etc/nginx/conf.d/khzios-limits.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=khzios_admin:10m rate=60r/m;
```

Spoza podanych sieci panel odpowiada `403`; zasoby strony (`/_next/…`, `/media/…`) zostają publiczne, bo korzysta z nich też strona dla odwiedzających. Duży `burst` jest celowy: przeglądarka po otwarciu panelu pobiera z wyprzedzeniem kilkanaście podstron z menu. Plik konfiguracyjny z adresem panelu powinien być czytelny tylko dla administratora: `sudo chmod 640 /etc/nginx/sites-available/khzios`.

**Ręczna blokada adresu.** Adresy prób widać w panelu: Dziennik → Logowania. Utwórz plik `/etc/nginx/khzios-blocked.conf`:

```nginx
deny 203.0.113.45;
deny 203.0.113.128/25;
```

i dołącz go w bloku `server` linią `include /etc/nginx/khzios-blocked.conf;`. Po każdej zmianie: `sudo nginx -t && sudo systemctl reload nginx`.

**Automatyczna blokada (fail2ban)** — tylko w układzie A; w układzie B cały ruch przychodzi z serwera uczelni, więc blokuje się tam. fail2ban blokuje w zaporze adresy, które wielokrotnie przekraczają limit `limit_req`:

```bash
# [serwer]
sudo apt install -y fail2ban
sudo nano /etc/fail2ban/jail.d/khzios.local
```

```ini
# Debian 12: bez tego fail2ban nie startuje (szuka pliku /var/log/auth.log, którego tam nie ma)
[sshd]
backend = systemd

# backend = auto każe czytać plik z logpath; domyślnie fail2ban czyta dziennik systemowy,
# do którego błędy nginx nie trafiają
[nginx-limit-req]
enabled  = true
backend  = auto
logpath  = /var/log/nginx/error.log
findtime = 10m
maxretry = 10
bantime  = 1h
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status nginx-limit-req     # "Currently banned: 0" i ścieżka logu
```

**Podejrzenie włamania na konto:** zablokuj je w Użytkownikach (wylogowuje wszystkie jego sesje), sprawdź Dziennik → Zmiany treści i cofnij niechciane zmiany (Kosz, ponowna edycja), nadaj nowe hasło tymczasowe i zresetuj logowanie dwuskładnikowe, zmień adres panelu. **Podejrzenie włamania na serwer:** zatrzymaj nginx (`sudo systemctl stop nginx`), zawiadom informatyków uczelni i odbuduj stronę na czystej maszynie z kopii sprzed incydentu, z nowymi hasłami.

### Miejsce na dysku

```bash
# [serwer]
df -h /                    # całość
docker system df           # obrazy, kontenery, wolumeny, pamięć podręczna budowania
sudo du -sh /var/backups/khzios
```

Bezpiecznie zwalniają miejsce: `docker image prune -f` (stare obrazy) i `docker builder prune -f` (pamięć podręczna budowania; następne budowanie potrwa dłużej). Jeśli rosną kopie, skróć w skrypcie okres 30 dni albo przenieś starsze poza serwer.

### Gdy coś nie działa

| Objaw                                                     | Co sprawdzić                                                                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 502 Bad Gateway                                           | `dc ps -a` — czy `app` działa i jest `healthy`; `dc logs app`; `dc up -d`                                                              |
| Strony zwracają błąd 500, `/api/health` odpowiada 503     | baza nie działa: `dc ps -a`, `dc logs db`, `dc up -d`. Aplikacja połączy się sama, bez restartu                                        |
| `migrate` kończy się błędem `P1000`                       | hasło w `.env.docker` różni się od hasła w bazie ([zmiana haseł](#zmiana-haseł-i-adresu-panelu))                                       |
| `migrate` kończy się innym błędem                         | `dc logs migrate`; najczęściej kod starszy niż wczytany zrzut (etap 2)                                                                 |
| Aplikacja nie startuje, w logach `Invalid configuration`  | błędny `APP_URL` w `.env.docker`                                                                                                       |
| Panel pod swoim adresem zwraca 404                        | `ADMIN_PATH` pusty lub błędny (ostrzeżenie w `dc logs app`)                                                                            |
| Po zalogowaniu panel wraca do formularza logowania        | strona otwarta przez `http://` przy `APP_URL` z `https://`; przez tunel SSH użyj Chrome, Edge lub Firefoksa                            |
| „Nieprawidłowy kod” mimo dobrej aplikacji w telefonie     | zegar: `timedatectl` na serwerze, automatyczny czas w telefonie                                                                        |
| „Zbyt wiele nieudanych prób logowania”                    | odczekaj 15 minut; sprawdź Dziennik → Logowania, czy to nie atak                                                                       |
| W Dzienniku wszystkie logowania mają ten sam adres        | proxy nie przekazuje adresu odwiedzającego (etap 7.3, układ B)                                                                         |
| Zmiany z panelu nie pojawiają się na stronie              | odśwież z pominięciem pamięci przeglądarki (Ctrl+F5); po zmianach wprost w bazie: `dc up -d --force-recreate app`                      |
| Zdjęcia nie wgrywają się, błąd 413                        | `client_max_body_size 25m` w nginx; limit na serwerze uczelni                                                                          |
| Zdjęcia nie wgrywają się, brak błędu 413                  | miejsce na dysku (`df -h /`); limity panelu: zdjęcie 15 MB, dokument 20 MB                                                             |
| `nginx -t`: `unknown directive "http2"`                   | starszy nginx: zamiast `http2 on;` napisz `listen 443 ssl http2;`                                                                      |
| Budowanie przerywa się komunikatem `Killed` lub kodem 137 | za mało pamięci: [zbuduj obrazy u siebie](#serwer-bez-internetu-lub-z-małą-pamięcią)                                                   |
| Budowanie nie może pobrać paczek lub czcionek             | brak wyjścia do internetu albo chwilowa awaria: ponów; trwale → [obrazy zbudowane u siebie](#serwer-bez-internetu-lub-z-małą-pamięcią) |
| Po restarcie serwera strona nie wstała                    | `systemctl status docker`, potem `dc up -d`                                                                                            |

### Czego nie robić

- `dc --profile seed run seed` — kasuje całą treść i wstawia przykładową.
- `dc down -v`, `docker volume rm`, `docker volume prune -a` — kasują bazę i wgrane pliki.
- Zmiana `APP_BIND` na `0.0.0.0` — wystawia aplikację do sieci z pominięciem zapory `ufw` i reverse proxy.
- Ręczne zmiany w tabelach poza panelem — przy następnym zapisie panel może je nadpisać, a strona pokaże je dopiero po odświeżeniu (raz na dobę).
- Wklejanie zawartości `.env.docker`, adresu panelu lub plików kopii do repozytorium, zgłoszeń i komunikatorów.
- Podnoszenie głównej wersji PostgreSQL przez samą zmianę numeru obrazu.

### Przekazanie strony następcy

- [ ] Dostęp SSH do serwera dla nowej osoby (jej klucz dodany, twój usunięty po przekazaniu).
- [ ] Uprawnienia do repozytorium na GitHubie.
- [ ] Konto administratora w panelu; twoje zablokowane po przekazaniu.
- [ ] Sekrety z menedżera haseł: hasło bazy, adres panelu.
- [ ] Dostęp do Google Search Console.
- [ ] Kontakt do informatyków uczelni i informacja, kto odnawia certyfikat.
- [ ] Miejsce kopii poza serwerem i data ostatniej próby odtworzenia.
- [ ] Wspólnie wykonana aktualizacja strony według tej instrukcji.
