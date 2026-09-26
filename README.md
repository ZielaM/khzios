# Strona Katedry Hodowli Zwierząt i Oceny Surowców

Aplikacja Next.js (App Router) z bazą PostgreSQL (Prisma), czterema językami (pl, en, uk, ru) przez `next-intl` i ISR dla stron rzadko zmienianych.

## Uruchomienie lokalne

```bash
cp .env.example .env      # uzupełnij DATABASE_URL (baza deweloperska)
pnpm install
pnpm db:generate          # klient Prisma w src/generated/prisma
pnpm prisma migrate deploy  # zaległe migracje (nie kasuje danych)
pnpm dev                  # http://localhost:3000, panel: http://localhost:3000/admin
```

Przydatne skrypty: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:chromium`, `pnpm pp` (lint + typecheck + prettier).

> `pnpm db:seed` **usuwa wszystkie dane** i wstawia dane przykładowe. W środowisku produkcyjnym (`NODE_ENV=production`) odmawia działania, chyba że ustawiono `ALLOW_DESTRUCTIVE_SEED=true`.

### Zmienne środowiskowe

| Zmienna        | Opis                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Connection string PostgreSQL (wymagana — bez niej serwer produkcyjny nie wystartuje).                                                                                                      |
| `APP_URL`      | Publiczny adres strony, używany w linkach kanonicznych, sitemapie i obrazkach udostępniania. Czytany w czasie działania, więc jeden obraz Dockera można skonfigurować dla różnych adresów. |
| `ADMIN_PATH`   | Adres panelu administracyjnego (`/<ADMIN_PATH>`): 8–63 małe litery, cyfry lub myślniki. W trybie deweloperskim domyślnie `admin`; na produkcji bez tej zmiennej panel jest wyłączony.      |
| `UPLOAD_DIR`   | Katalog na zdjęcia i PDF-y wgrane w panelu (domyślnie `./uploads`, w Dockerze wolumen `uploads`).                                                                                          |

## Wdrożenie (Docker Compose, serwer uczelni)

Stos w `docker-compose.yml`: PostgreSQL, jednorazowy krok migracji i aplikacja (`next start`, użytkownik bez uprawnień root, healthcheck `/api/health`).

```bash
cp .env.docker.example .env.docker   # ustaw hasło bazy i APP_URL
docker compose --env-file .env.docker up -d --build
```

- Obraz buduje się **bez dostępu do bazy** — strony oparte na danych renderują się przy pierwszym wejściu i trafiają do cache (ISR). Plik `.env` nie trafia do obrazu (`.dockerignore`).
- Migracje (`prisma migrate deploy`) uruchamia usługa `migrate` przed startem aplikacji, przy każdym `up`.
- Dane przykładowe dla świeżej instalacji (**kasuje zawartość bazy**):
  `docker compose --env-file .env.docker --profile seed run --rm seed`
- Przed aplikacją należy postawić reverse proxy z HTTPS (np. nginx uczelni) kierujące ruch na port `APP_PORT`. Port jest domyślnie dostępny tylko z tego samego serwera (`APP_BIND=127.0.0.1`). Konfiguracja nginx, opcjonalne ograniczenie panelu do sieci uczelni, blokowanie adresów IP i kopie zapasowe: [docs/serwer-uczelni.md](docs/serwer-uczelni.md).
- Pierwsze konto panelu (hasło zostanie wczytane z klawiatury):
  `docker compose --env-file .env.docker run --rm migrate pnpm admin:create --login jan --name "Jan Kowalski" --role admin`
- Kopia zapasowa to **baza i wolumen `uploads`** (zdjęcia i PDF-y z panelu) — jedno bez drugiego jest niepełne.

## Formatowanie Artykułów (Predefiniowane Style HTML)

W aplikacji zaimplementowaliśmy zautomatyzowane formatowanie artykułów. Pisząc artykuł w edytorze WYSIWYG, nie musisz martwić się o dodawanie klas CSS – standardowe znaczniki HTML otrzymują profesjonalny, akademicki wygląd z pudełka. Obsługiwany jest również tryb wysokiego kontrastu (WCAG).

Poniższe znaczniki HTML posiadają dedykowane, predefiniowane style w widoku artykułu:

- `<p>` - standardowe akapity z odpowiednim światłem i kolorem ułatwiającym czytanie. Pierwszy akapit w artykule jest automatycznie traktowany jako tzw. "lead" (powiększony, z kolorem głównym aplikacji).
- `<h2>` - główne śródtytuły, z wyraźnym powiększeniem i marginesem odcinającym nową sekcję.
- `<h3>` - mniejsze śródtytuły do tworzenia podsekcji.
- `<ul>` oraz `<ol>` - listy nieuporządkowane i uporządkowane (automatyczne wcięcia i marginesy).
- `<li>` - elementy list z zachowaniem odstępów.
- `<a>` - odnośniki w tekście (podkreślenia, reakcja na najechanie kursorem).
- `<blockquote>` - wyróżnione cytaty z wyraźnym lewym obramowaniem, subtelnym tłem oraz dekoracyjnym znakiem cudzysłowu.
- `<div class="highlight-box">` - ramka wyróżnienia (przycisk „Wyróżnienie” w edytorze), np. na ważne terminy.

Edytor w panelu oferuje tylko te elementy (oraz pogrubienie i kursywę), a serwer przy zapisie usuwa wszystko inne — wklejony z Worda czy strony internetowej tekst traci obce style i skrypty, a artykuł zawsze wygląda spójnie.

Wszystkie powyższe znaczniki automatycznie dostosowują swój wygląd (kolory, tła, krawędzie), gdy użytkownik włączy tryb wysokiego kontrastu (WCAG), zachowując przy tym pełną dostępność.

## Zdjęcia na stronie

Zdjęcia sekcji (nagłówek strony głównej, „O nas”, „Dla studenta”, „Kontakt”, banery zespołów) dodaje się w panelu: **Zdjęcia stron**. Tam też ustawia się ich kolejność i opisy alternatywne w każdym języku. Brak opisu w danym języku zastępuje ten sam łańcuch co w tłumaczeniach (uk/ru → en → pl), a brak jakiegokolwiek — domyślny opis sekcji. Wgrane pliki są zmniejszane do 2560 px, zapisywane jako WebP i pozbawiane metadanych EXIF (w tym lokalizacji GPS).

Zdjęcia przykładowe z `public/images/<sekcja>/` (z opisami w `alt.json`) trafiają do bazy tylko przez `pnpm db:seed`. Świeża instalacja produkcyjna startuje bez zdjęć, a sekcje wyglądają wtedy poprawnie, tylko bez tła.

**Pozostałe obrazy:** `public/og-image.png` (1200×630) to domyślny podgląd linku w social mediach dla stron bez własnego zdjęcia, a `public/logo-seal.png` to logo w danych strukturalnych (JSON-LD). Wszystkie zdjęcia trafiają automatycznie do `sitemap.xml`.

## Panel administracyjny

Panel pod adresem `/<ADMIN_PATH>` (w trybie deweloperskim `/admin`) służy do zarządzania całą treścią: aktualnościami, strefą studenta, pracownikami, zespołami, publikacjami, kierownictwem, zdjęciami, tekstami stron i ustawieniami (kontakt, deklaracja dostępności, polityka prywatności). Interfejs jest po polsku. Treści wymagają wersji polskiej, pozostałe języki są opcjonalne.

**Konta i role.** Redaktor edytuje treści i przywraca elementy z kosza. Administrator dodatkowo zmienia ustawienia, zarządza kontami, przegląda dziennik i usuwa elementy z kosza na zawsze. Pierwsze konto zakłada się poleceniem `pnpm admin:create --login jan --name "Jan Kowalski" --role admin` (na serwerze przez `docker compose ... run --rm migrate`, patrz wyżej). Kolejne konta tworzy administrator w panelu (**Użytkownicy**). Panel generuje wtedy hasło tymczasowe, a nowa osoba przy pierwszym logowaniu ustawia własne hasło i aplikację uwierzytelniającą.

**Konta deweloperskie** tworzy `pnpm db:seed` (tylko poza produkcją — na serwerze seed ich nie zakłada). Kod dwuskładnikowy wygeneruje aplikacja uwierzytelniająca (sekret dodany ręcznie) albo polecenie:

```bash
node -e "const {TOTP,Secret}=require('otpauth');console.log(new TOTP({secret:Secret.fromBase32(process.argv[1])}).generate())" JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP
```

| Login      | Hasło              | Rola          | Sekret TOTP                        |
| ---------- | ------------------ | ------------- | ---------------------------------- |
| `admin`    | `dev-password-123` | administrator | `JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP` |
| `redaktor` | `dev-password-456` | redaktor      | `KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU` |
| `nowy`     | `dev-password-789` | redaktor      | brak — pokazuje konfigurację 2FA   |

(Konto `weryfikacja` służy testom e2e blokady logowania.)

**Zabezpieczenia.**

- Hasła są hashowane argon2id i mają co najmniej 12 znaków. Logowanie wymaga drugiego składnika (TOTP), a w razie utraty telefonu działa 10 jednorazowych kodów zapasowych.
- Sesja wygasa po 30 minutach bezczynności i najpóźniej po 8 godzinach. Ciasteczko jest `HttpOnly`, `SameSite=Strict`, a przy HTTPS także `Secure` z prefiksem `__Host-`.
- Po 5 nieudanych próbach na login lub 20 z jednego adresu w ciągu 15 minut logowanie jest wstrzymane. Błąd logowania jest zawsze ten sam, niezależnie od tego, czy login istnieje.
- Podstrony panelu bez zalogowania zwracają 404, a pod adresem wewnętrznym `/admin-panel` panelu „nie ma”. Panel ma nagłówek `noindex` i nie wysyła adresu w `Referer`.
- Niestandardowy adres (`ADMIN_PATH`) jedynie ukrywa panel przed automatycznymi skanerami i nie zastępuje hasła ani 2FA. Z tego samego powodu zły login nie zwraca 404: przyciemniłoby to tylko formularz, a utrudniło pracę samemu redaktorowi.
- Wszystkie zmiany treści, logowania i podejrzane zapytania trafiają do **Dziennika**. Wpisy logowań i zapytań są przechowywane 90 dni.

**Odświeżanie strony.** Każdy zapis w panelu od razu odświeża strony publiczne (rewalidacja na żądanie). Dodatkowo strony odświeżają się same raz na dobę, co pokrywa treści zależne od daty (np. okno publikacji z ostatnich 5 lat, rok w stopce) i dane zmienione poza panelem.

**Kosz.** Usunięte elementy można przywrócić przez 30 dni, a potem znikają razem z plikami, których nic innego nie używa.
