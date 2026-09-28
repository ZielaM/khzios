# Aktualizacja Next.js i patche do zależności

Next.js ma w projekcie lokalny patch, więc Dependabot go nie aktualizuje (`ignore` w `.github/dependabot.yml`), a aktualizacje robi się ręcznie według tej instrukcji. Alerty bezpieczeństwa dla Next dalej pokazują się w zakładce **Security** repozytorium, więc pilnej aktualizacji nie przegapisz.

## Po co jest patch

**Błąd:** gdy odwiedzający przerwie ładowanie (zamknie kartę albo przejdzie na inną stronę), zanim serwer skończy przygotowywać zdjęcie (`/_next/image` dla pliku z `public/` albo `/media/`), to zdjęcie w tym rozmiarze przestaje się ładować **dla wszystkich**, aż do restartu serwera. Dotyczy `next start`, czyli produkcji i obrazu Dockera.

**Przyczyna:** Next pobiera lokalne zdjęcie przez wewnętrzne, udawane żądanie, podpięte pod połączenie pierwszego odwiedzającego. Kiedy ten się rozłączy, wewnętrzne żądanie nigdy się nie kończy. Wszystkie kolejne prośby o ten sam adres czekają na nie bez końca.

**Status u twórców Next (stan na 27.09.2026):**

- zgłoszenie: [vercel/next.js#96538](https://github.com/vercel/next.js/issues/96538) z 3.08.2026, zamknięte;
- poprawka: [vercel/next.js#98168](https://github.com/vercel/next.js/pull/98168), zmerge'owana 10.09.2026 do gałęzi `canary`; jest w `16.4.0-canary.27` i nowszych;
- w **stabilnych** wydaniach jeszcze jej nie ma: 16.3.6 wciąż ma błąd, sprawdzone skryptem niżej.

**Nasz patch** to ta sama oficjalna poprawka przeniesiona na zainstalowaną wersję. Gdzie leży:

- `patches/next@<wersja>.patch` — sam patch (zmienia jedną funkcję, `fetchInternalImage` w `dist/server/image-optimizer.js`);
- `pnpm-workspace.yaml` → `patchedDependencies` — informuje pnpm, do której wersji go nałożyć;
- `scripts/check-image-abort.mjs` — sprawdza na działającym serwerze, czy błąd występuje.

## Kiedy można usunąć patch

Patch jest zbędny, gdy **stabilna** wersja Next zawiera PR #98168. Najpewniej będzie to 16.4.0. Sprawdzaj w tej kolejności:

1. **Informacje o wydaniu.** W [wydaniach Next.js](https://github.com/vercel/next.js/releases) wyszukaj na stronie danej wersji `#98168`. Hasła pomocnicze: `fetchInternalImage`, `image optimizer`, `abort`, `hang`. Uwaga: wersje `-canary` to wydania testowe i nie nadają się na produkcję.
2. **Kod w zainstalowanej wersji** (po `pnpm add`, **bez** patcha):

   ```bash
   grep -n "createRequestResponseMocks" node_modules/next/dist/server/image-optimizer.js
   ```

   - Jeśli wynik wskazuje linię w funkcji `fetchInternalImage` z `socket: _req.socket` w pobliżu, **błąd jest**.
   - Jeśli zamiast tego widać `new _mockrequest.MockedResponse({ maximumResponseBody })` i komentarz zaczynający się od _„The mocked request keeps the requester's socket…”_, **poprawka jest**.

3. **Test w praktyce:** zbuduj i uruchom produkcyjny serwer, a potem odpal skrypt:

   ```bash
   pnpm build && pnpm start                 # terminal 1
   node scripts/check-image-abort.mjs       # terminal 2
   ```

   - `exit 0` i komunikat _„No hang… not affected”_ oznaczają, że patch jest zbędny.
   - `HANG` i _„The bug is present”_ oznaczają, że patch wciąż jest potrzebny.
   - Przed ponownym uruchomieniem zrestartuj serwer, bo przetworzone rozmiary zdjęć są zapamiętywane.

   Skrypt przetestowałem w obie strony. Na Next 16.3.6 bez patcha zgłosił zawieszenie już w drugiej próbie, a z patchem przeszedł 30 z 30 prób.

## Aktualizacja Next krok po kroku

```bash
git switch -c deps/next-<nowa> origin/main

# 1. Usuń stary patch: plik i wpis
git rm patches/next@<stara>.patch
#    w pnpm-workspace.yaml usuń linię "next@<stara>: patches/..." pod
#    patchedDependencies (a jeśli była jedyna, także samo "patchedDependencies:")

# 2. Podbij Next razem z jego konfiguracją ESLint (zawsze ta sama wersja)
pnpm add -E next@<nowa> eslint-config-next@<nowa>

# 3. Sprawdź, czy poprawka jest już w tej wersji (sekcja wyżej)
```

### A) Błąd nadal jest: odtwórz patch

```bash
pnpm patch next@<nowa>
# pnpm wypisze katalog tymczasowy. Otwórz w nim
#   dist/server/image-optimizer.js
# znajdź funkcję fetchInternalImage i zamień fragment
#   const mocked = (0, _mockrequest.createRequestResponseMocks)({ ... });
# na blok z poprzedniego patcha (git show HEAD:patches/next@<stara>.patch)
pnpm patch-commit <ten katalog>
```

`pnpm patch-commit` zapisze `patches/next@<nowa>.patch` i wpis w `pnpm-workspace.yaml`. Sprawdź, czy nad wpisem został komentarz z linkami do zgłoszenia i PR-a. Jeśli pnpm go usunął, przywróć go. Potem sprawdź:

```bash
grep -c "Backport of vercel" node_modules/next/dist/server/image-optimizer.js   # 1, jeśli użyłeś bloku z poprzedniego patcha
pnpm build && pnpm start                  # terminal 1
node scripts/check-image-abort.mjs        # terminal 2 → exit 0
```

Jeśli kod funkcji zmienił się tak bardzo, że stary blok nie pasuje, zajrzyj do [zmiany w PR #98168](https://github.com/vercel/next.js/pull/98168/files). Idea jest zawsze ta sama: atrapa **odpowiedzi** (`MockedResponse`) nie może dostać `socket` odwiedzającego, a atrapa **żądania** (`MockedRequest`) może.

### B) Poprawka jest w Next: pożegnaj patch

- Nie odtwarzaj patcha. Usuń komentarz o nim z `pnpm-workspace.yaml`.
- W `.github/dependabot.yml` usuń `next` i `eslint-config-next` z `ignore`. Od tej pory Dependabot będzie aktualizował Next sam, najlepiej dopisz je do grupy `react`.
- Skrypt `scripts/check-image-abort.mjs` może zostać jako test regresji albo zniknąć razem z tym dokumentem.

### Na koniec, w obu przypadkach

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
pnpm test:e2e:chromium        # albo pełne e2e, jeśli masz przeglądarki
git add -A && git commit -m "build(deps): next <nowa>"
git push -u origin deps/next-<nowa>   # PR; CI i Vercel sprawdzą resztę
```

Przy dużym skoku wersji (np. 16 → 17) przeczytaj wcześniej przewodnik migracji w dokumentacji Next.

## Patche do innych pakietów (na przyszłość)

Patch to naprawa tymczasowa, na czas aż twórcy pakietu wydadzą poprawkę. Procedura jest zawsze ta sama:

```bash
pnpm patch <pakiet>@<wersja>       # wypisze katalog tymczasowy
# popraw pliki w tym katalogu (zwykle dist/..., czyli kod już zbudowany)
pnpm patch-commit <katalog>        # patches/<pakiet>@<wersja>.patch + wpis w pnpm-workspace.yaml
git add patches pnpm-workspace.yaml pnpm-lock.yaml
```

Zasady:

- **Najpierw poszukaj zgłoszenia** u twórców pakietu. Jeśli poprawka już istnieje, przenieś dokładnie ją, a nie własną wersję. Łatwiej będzie potem ocenić, kiedy patch jest zbędny.
- **Nad wpisem w `pnpm-workspace.yaml` napisz komentarz:** co naprawia, link do zgłoszenia lub PR-a i kiedy go usunąć.
- **pnpm pilnuje patchy sam.** Jeśli patch jest przypisany do wersji, której nie ma w projekcie, instalacja się przerywa (`ERR_PNPM_UNUSED_PATCH`). Tak samo, gdy patch nie pasuje do kodu pakietu (`ERR_PNPM_PATCH_FAILED`). To sygnał, że trzeba go odtworzyć albo usunąć.
- **Gdy pakiet z patchem aktualizuje Dependabot,** jego PR padnie na instalacji. Albo dodaj pakiet do `ignore` w `.github/dependabot.yml` i aktualizuj go ręcznie jak Next, albo odtwórz patch na gałęzi PR-a.
- **Wersja pnpm ma znaczenie.** Lockfile z patchem zapisany przez pnpm 11 został odrzucony przez pnpm 10 na Vercelu (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`). Dlatego wersję wyznacza `packageManager` w `package.json`, a wszyscy (Ty, CI, Vercel, Docker) używają tej samej.
- **Czy patch jest nałożony,** sprawdzisz, szukając zmienionej linii w `node_modules/<pakiet>/…`. Jeśli nie jest, pomaga `rm -rf node_modules && pnpm install`.
