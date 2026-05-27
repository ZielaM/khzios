// Routing Configuration:
// Centralized setup for `next-intl` defining supported locales and translating route pathnames.
// Instead of creating separate physical folders for `/news` vs `/aktualnosci`,
// Next.js handles routing dynamically through the `[locale]` dynamic segment,
// and `next-intl` maps the localized URL string back to the correct physical component route.

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
    '/about-us/structure/secretariat': {
      pl: '/o-nas/struktura/sekretariat',
      en: '/about-us/structure/secretariat',
      uk: '/pro-nas/struktura/sekretariat',
      ru: '/o-nas/struktura/sekretariat',
    },
    '/about-us/structure/ruminants': {
      pl: '/o-nas/struktura/przezuwajace',
      en: '/about-us/structure/ruminants',
      uk: '/pro-nas/struktura/zhuyni',
      ru: '/o-nas/struktura/zhvachnye',
    },
    '/about-us/structure/poultry': {
      pl: '/o-nas/struktura/drob',
      en: '/about-us/structure/poultry',
      uk: '/pro-nas/struktura/ptytsia',
      ru: '/o-nas/struktura/ptitsa',
    },
    '/about-us/structure/swine': {
      pl: '/o-nas/struktura/trzoda',
      en: '/about-us/structure/swine',
      uk: '/pro-nas/struktura/svyni',
      ru: '/o-nas/struktura/svini',
    },
    '/about-us/structure/fur-animals': {
      pl: '/o-nas/struktura/futerkowe',
      en: '/about-us/structure/fur-animals',
      uk: '/pro-nas/struktura/khutrovi',
      ru: '/o-nas/struktura/pushnye',
    },
    '/about-us/structure/veterinary': {
      pl: '/o-nas/struktura/weterynaryjna',
      en: '/about-us/structure/veterinary',
      uk: '/pro-nas/struktura/veterynarna',
      ru: '/o-nas/struktura/veterinarnaya',
    },
    '/about-us/structure/zlotnicka-pig-herdbooks': {
      pl: '/o-nas/struktura/ksiegi-zlotnickie',
      en: '/about-us/structure/zlotnicka-pig-herdbooks',
      uk: '/pro-nas/struktura/knyhy-zlotnytski',
      ru: '/o-nas/struktura/knigi-zlotnitskie',
    },
    '/about-us/publications': {
      pl: '/o-nas/publikacje',
      en: '/about-us/publications',
      uk: '/pro-nas/publikatsii',
      ru: '/o-nas/publikatsii',
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
  },
});

export type Locale = (typeof routing.locales)[number];

// Re-export navigation hooks that are strictly typed and aware of localized routes
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
