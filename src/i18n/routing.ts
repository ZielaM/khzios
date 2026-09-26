// Localized URLs: next-intl maps e.g. /pl/aktualnosci to app/[locale]/news,
// so each page exists once in the file tree.

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pl', 'en', 'uk', 'ru'],
  defaultLocale: 'pl',
  pathnames: {
    '/': '/',
    '/news': {
      pl: '/aktualnosci',
      en: '/news',
      uk: '/novyny',
      ru: '/novosti',
    },
    '/news/[id]': {
      pl: '/aktualnosci/[id]',
      en: '/news/[id]',
      uk: '/novyny/[id]',
      ru: '/novosti/[id]',
    },
    '/about-us': {
      pl: '/o-nas',
      en: '/about-us',
      uk: '/pro-nas',
      ru: '/o-nas',
    },
    '/about-us/structure': {
      pl: '/o-nas/struktura',
      en: '/about-us/structure',
      uk: '/pro-nas/struktura',
      ru: '/o-nas/struktura',
    },
    '/about-us/structure/head': {
      pl: '/o-nas/struktura/kierownik',
      en: '/about-us/structure/head',
      uk: '/pro-nas/struktura/kerivnyk',
      ru: '/o-nas/struktura/rukovoditel',
    },
    '/about-us/publications': {
      pl: '/o-nas/publikacje',
      en: '/about-us/publications',
      uk: '/pro-nas/publikatsii',
      ru: '/o-nas/publikatsii',
    },
    // Team slugs are stored per language in TeamTranslation.slug
    '/about-us/structure/[team]': {
      pl: '/o-nas/struktura/[team]',
      en: '/about-us/structure/[team]',
      uk: '/pro-nas/struktura/[team]',
      ru: '/o-nas/struktura/[team]',
    },
    '/about-us/structure/[team]/[member]': {
      pl: '/o-nas/struktura/[team]/[member]',
      en: '/about-us/structure/[team]/[member]',
      uk: '/pro-nas/struktura/[team]/[member]',
      ru: '/o-nas/struktura/[team]/[member]',
    },
    '/student': {
      pl: '/student',
      en: '/student',
      uk: '/student',
      ru: '/student',
    },
    '/contact': {
      pl: '/kontakt',
      en: '/contact',
      uk: '/kontakt',
      ru: '/kontakt',
    },
    '/accessibility': {
      pl: '/deklaracja-dostepnosci',
      en: '/accessibility-statement',
      uk: '/deklaratsiia-dostupnosti',
      ru: '/deklaratsiya-dostupnosti',
    },
  },
});

export type Locale = (typeof routing.locales)[number];

// Re-export navigation hooks that are strictly typed and aware of localized routes
export const {
  Link,
  redirect,
  permanentRedirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
