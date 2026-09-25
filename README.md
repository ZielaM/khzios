This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
