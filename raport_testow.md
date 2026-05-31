# 🧪 Raport z Testów

## 📊 Testy Jednostkowe i Pokrycie Kodu (Coverage)

Testy zostały uruchomione za pomocą `pnpm test:coverage` i używają środowiska `vitest` z silnikiem `v8`.

**Podsumowanie wyników:**

- **Pliki testowe:** 50 zaliczonych
- **Wszystkie testy:** 298 zaliczonych
- **Czas wykonania:** ~29.61s

### Tabela Pokrycia (Coverage Report)

| Kategoria                  | Pokrycie (%) |
| -------------------------- | ------------ |
| **Stmts** (Instrukcje)     | 100%         |
| **Branch** (Rozgałęzienia) | 100%         |
| **Funcs** (Funkcje)        | 100%         |
| **Lines** (Linie kodu)     | 100%         |

<details>
<summary><b>Rozwiń pełną tabelę dla poszczególnych plików</b></summary>

```text
-------------------------------------|---------|----------|---------|---------|-------------------
File                                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------------------|---------|----------|---------|---------|-------------------
All files                            |     100 |      100 |     100 |     100 |
 components/AnimateOnce              |     100 |      100 |     100 |     100 |
  AnimateOnce.tsx                    |     100 |      100 |     100 |     100 |
 components/BackLink                 |     100 |      100 |     100 |     100 |
  BackLink.tsx                       |     100 |      100 |     100 |     100 |
 components/ContactProfile           |     100 |      100 |     100 |     100 |
  ContactProfile.tsx                 |     100 |      100 |     100 |     100 |
 components/ExternalTeamPage         |     100 |      100 |     100 |     100 |
  ExternalTeamPage.tsx               |     100 |      100 |     100 |     100 |
 components/Footer                   |     100 |      100 |     100 |     100 |
  Footer.tsx                         |     100 |      100 |     100 |     100 |
 components/FullTeamPage             |     100 |      100 |     100 |     100 |
  FullTeamPage.tsx                   |     100 |      100 |     100 |     100 |
 components/LanguageSwitcher         |     100 |      100 |     100 |     100 |
  LanguageSwitcher.tsx               |     100 |      100 |     100 |     100 |
 components/LocationMap              |     100 |      100 |     100 |     100 |
  LocationMap.tsx                    |     100 |      100 |     100 |     100 |
 components/Navbar                   |     100 |      100 |     100 |     100 |
  DropdownMenu.tsx                   |     100 |      100 |     100 |     100 |
  NavItem.tsx                        |     100 |      100 |     100 |     100 |
  Navbar.tsx                         |     100 |      100 |     100 |     100 |
  SettingsDropdown.tsx               |     100 |      100 |     100 |     100 |
  WcagControls.tsx                   |     100 |      100 |     100 |     100 |
 components/NewsGallery              |     100 |      100 |     100 |     100 |
  NewsGallery.tsx                    |     100 |      100 |     100 |     100 |
 components/NewsGrid                 |     100 |      100 |     100 |     100 |
  NewsGridServer.tsx                 |     100 |      100 |     100 |     100 |
  NewsGridSkeleton.tsx               |     100 |      100 |     100 |     100 |
 components/NewsSearchForm           |     100 |      100 |     100 |     100 |
  NewsSearchForm.tsx                 |     100 |      100 |     100 |     100 |
 components/NewsTile                 |     100 |      100 |     100 |     100 |
  NewsTile.tsx                       |     100 |      100 |     100 |     100 |
  NewsTileSkeleton.tsx               |     100 |      100 |     100 |     100 |
 components/NotFoundPage             |     100 |      100 |     100 |     100 |
  NotFoundPage.tsx                   |     100 |      100 |     100 |     100 |
 components/OrcidIcon                |     100 |      100 |     100 |     100 |
  OrcidIcon.tsx                      |     100 |      100 |     100 |     100 |
 components/Pagination               |     100 |      100 |     100 |     100 |
  Pagination.tsx                     |     100 |      100 |     100 |     100 |
 components/PublicationsListServer   |     100 |      100 |     100 |     100 |
  PublicationsListServer.tsx         |     100 |      100 |     100 |     100 |
 components/PublicationsListSkeleton |     100 |      100 |     100 |     100 |
  PublicationsListSkeleton.tsx       |     100 |      100 |     100 |     100 |
 components/PublicationsSearchForm   |     100 |      100 |     100 |     100 |
  PublicationsSearchForm.tsx         |     100 |      100 |     100 |     100 |
 components/ReadingProgress          |     100 |      100 |     100 |     100 |
  ReadingProgress.tsx                |     100 |      100 |     100 |     100 |
 components/RecentNews               |     100 |      100 |     100 |     100 |
  RecentNewsServer.tsx               |     100 |      100 |     100 |     100 |
  RecentNewsSkeleton.tsx             |     100 |      100 |     100 |     100 |
 components/RelatedNews              |     100 |      100 |     100 |     100 |
  RelatedNews.tsx                    |     100 |      100 |     100 |     100 |
  RelatedNewsSkeleton.tsx            |     100 |      100 |     100 |     100 |
 components/ScrollRestoration        |     100 |      100 |     100 |     100 |
  ScrollRestoration.tsx              |     100 |      100 |     100 |     100 |
 components/ScrollToTop              |     100 |      100 |     100 |     100 |
  ScrollToTop.tsx                    |     100 |      100 |     100 |     100 |
 components/ShareButton              |     100 |      100 |     100 |     100 |
  ShareButton.tsx                    |     100 |      100 |     100 |     100 |
 components/SpotlightGrid            |     100 |      100 |     100 |     100 |
  SpotlightGrid.tsx                  |     100 |      100 |     100 |     100 |
 components/TeamHero                 |     100 |      100 |     100 |     100 |
  TeamHero.tsx                       |     100 |      100 |     100 |     100 |
 components/TeamMembers              |     100 |      100 |     100 |     100 |
  TeamMembers.tsx                    |     100 |      100 |     100 |     100 |
 components/TeamPublications         |     100 |      100 |     100 |     100 |
  TeamPublications.tsx               |     100 |      100 |     100 |     100 |
 components/TeamResearch             |     100 |      100 |     100 |     100 |
  TeamResearch.tsx                   |     100 |      100 |     100 |     100 |
 components/TeamTeaching             |     100 |      100 |     100 |     100 |
  TeamTeaching.tsx                   |     100 |      100 |     100 |     100 |
 lib                                 |     100 |      100 |     100 |     100 |
  content-utils.ts                   |     100 |      100 |     100 |     100 |
  head-queries.ts                    |     100 |      100 |     100 |     100 |
  news-queries.ts                    |     100 |      100 |     100 |     100 |
  rss.ts                             |     100 |      100 |     100 |     100 |
  secretariat-queries.ts             |     100 |      100 |     100 |     100 |
  student-queries.ts                 |     100 |      100 |     100 |     100 |
  team-queries.ts                    |     100 |      100 |     100 |     100 |
  translations.ts                    |     100 |      100 |     100 |     100 |
  url-utils.ts                       |     100 |      100 |     100 |     100 |
  validation.ts                      |     100 |      100 |     100 |     100 |
  working-hours.ts                   |     100 |      100 |     100 |     100 |
-------------------------------------|---------|----------|---------|---------|-------------------
```

</details>

---

## 🎭 Testy End-to-End (E2E)

Testy zostały uruchomione za pomocą `pnpm test:e2e` i używają środowiska `Playwright`.

**Podsumowanie wyników:**

- **Środowisko:** 4 workery
- **Status:** Wszyskie testy zakończone sukcesem!
- **Wszystkie testy:** 123 zaliczone
- **Czas wykonania:** ~6.2m

```text
$ playwright test

Running 123 tests using 4 workers
  123 passed (6.2m)

To open last HTML report run:

  pnpm exec playwright show-report
```
