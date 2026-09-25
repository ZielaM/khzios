# Strona Katedry Hodowli Zwierząt i Oceny Surowców

Aplikacja Next.js (App Router) z bazą PostgreSQL (Prisma), czterema językami (pl, en, uk, ru) przez `next-intl` i ISR dla stron rzadko zmienianych.

## Uruchomienie lokalne

```bash
cp .env.example .env      # uzupełnij DATABASE_URL (baza deweloperska)
pnpm install
pnpm db:generate          # klient Prisma w src/generated/prisma
pnpm dev                  # http://localhost:3000
```

Przydatne skrypty: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e:chromium`, `pnpm pp` (lint + typecheck + prettier).

> `pnpm db:seed` **usuwa wszystkie dane** i wstawia dane przykładowe. W środowisku produkcyjnym (`NODE_ENV=production`) odmawia działania, chyba że ustawiono `ALLOW_DESTRUCTIVE_SEED=true`.

### Zmienne środowiskowe

| Zmienna        | Opis                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Connection string PostgreSQL (wymagana — bez niej serwer produkcyjny nie wystartuje).                                                                                                      |
| `APP_URL`      | Publiczny adres strony, używany w linkach kanonicznych, sitemapie i obrazkach udostępniania. Czytany w czasie działania, więc jeden obraz Dockera można skonfigurować dla różnych adresów. |

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
- Przed aplikacją należy postawić reverse proxy z HTTPS (np. nginx uczelni) kierujące ruch na port `APP_PORT`.

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

Wszystkie powyższe znaczniki automatycznie dostosowują swój wygląd (kolory, tła, krawędzie), gdy użytkownik włączy tryb wysokiego kontrastu (WCAG), zachowując przy tym pełną dostępność.

## Zdjęcia na stronie (podmiana bez zmian w kodzie)

Zdjęcia nie są wpisane w kod — każda sekcja strony wyświetla to, co leży w jej folderze w `public/images/`. Żeby podmienić zdjęcia, wystarczy usunąć przykładowe pliki (`przyklad-*.jpg`), wrzucić własne i przebudować aplikację (`pnpm build` / nowy obraz Dockera — Next.js serwuje tylko pliki obecne w `public/` w czasie builda).

| Folder                        | Gdzie się pojawia                                        | Ile zdjęć |
| ----------------------------- | -------------------------------------------------------- | --------- |
| `public/images/hero/`         | Strona główna — przenikające się zdjęcia w tle nagłówka  | wszystkie |
| `public/images/about-us/`     | „O nas” — tło nagłówka, obrazek przy udostępnianiu linku | pierwsze  |
| `public/images/student/`      | „Dla studenta” — baner na górze strony                   | pierwsze  |
| `public/images/contact/`      | „Kontakt” — zdjęcie budynku obok mapy                    | pierwsze  |
| `public/images/teams/<slug>/` | Baner zespołu, miniatura na liście zespołów, obrazek OG  | pierwsze  |

`<slug>` to identyfikator zespołu z bazy (np. `ruminants`, `poultry`, `swine`, `fur-animals`, `veterinary`, `zlotnicka-pig-herdbooks`). Pusty lub nieistniejący folder = sekcja wygląda jak przed dodaniem zdjęć.

**Zasady:**

- Kolejność wyznacza nazwa pliku — używaj prefiksów `01-`, `02-`, `10-`… (sortowanie uwzględnia liczby).
- Nazwy plików opisowe, małymi literami, bez polskich znaków i spacji, np. `01-obora-doswiadczalna.jpg` — to też sygnał dla Google Grafika.
- Formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`. Zdjęcia najlepiej jako JPG, ok. 1920–2560 px szerokości i do ~500 KB — Next.js sam serwuje przeglądarkom AVIF/WebP w odpowiednim rozmiarze.
- Zdjęcia w nagłówkach są przycinane (`object-fit: cover`) i przyciemniane pod tekst — ważny motyw trzymaj blisko środka kadru.

**Teksty alternatywne (SEO i dostępność)** — opcjonalny plik `alt.json` w tym samym folderze, klucze to nazwy plików:

```json
{
  "01-obora-doswiadczalna.jpg": {
    "pl": "Krowy w oborze doświadczalnej katedry",
    "en": "Cows in the department's experimental barn",
    "uk": "Корови в дослідному корівнику кафедри",
    "ru": "Коровы в экспериментальном коровнике кафедры"
  }
}
```

Brakujący język korzysta z tego samego łańcucha zastępstw co tłumaczenia w bazie (uk/ru → en → pl). Plik bez wpisu dostaje domyślny opis sekcji (np. nazwę zespołu). Przykład: `public/images/hero/alt.json`.

**Pozostałe obrazy:** `public/og-image.png` (1200×630) to domyślny podgląd linku w social mediach dla stron bez własnego zdjęcia, a `public/logo-seal.png` to logo w danych strukturalnych (JSON-LD). Wszystkie zdjęcia trafiają automatycznie do `sitemap.xml`.
