import type { AbstractIntlMessages } from 'next-intl';

/**
 * Translation namespaces used by client components. Only these are sent to
 * the browser; server components read the full messages on the server.
 * A unit test checks that every 'use client' component's namespace is here.
 */
export const CLIENT_NAMESPACES = [
  'Navbar',
  'Wcag',
  'LocaleSwitcher',
  'HeroSlideshow',
  'NewsPage',
  'NewsDetails',
  'PublicationsPage',
  'StudentsPage',
  'ErrorPage',
] as const;

export function pickClientMessages(
  messages: AbstractIntlMessages
): AbstractIntlMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in messages).map((ns) => [
      ns,
      messages[ns],
    ])
  );
}
