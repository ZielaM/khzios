import type { AbstractIntlMessages } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('content-overrides');

/**
 * Page texts the admin panel may change, by messages namespace. Without a
 * key list the whole namespace is editable. Texts with plural rules (e.g.
 * the home page numbers) are left out.
 */
export const EDITABLE_TEXTS: {
  namespace: string;
  label: string;
  keys?: string[];
}[] = [
  {
    namespace: 'HomePage',
    label: 'Strona główna',
    keys: [
      'heroTitle',
      'heroSubtitle',
      'audienceTitle',
      'studentsDesc',
      'candidatesDesc',
      'researchersDesc',
      'partnersDesc',
      'researchTitle',
    ],
  },
  { namespace: 'AboutUsPage', label: 'O nas' },
  {
    namespace: 'StudentsPage',
    label: 'Strefa studenta',
    keys: ['metaDescription'],
  },
  {
    namespace: 'ContactPage',
    label: 'Kontakt',
    keys: ['metaDescription', 'mapNotice'],
  },
  {
    namespace: 'Footer',
    label: 'Stopka',
    keys: ['university', 'faculty', 'address'],
  },
  { namespace: 'AccessibilityPage', label: 'Deklaracja dostępności' },
  { namespace: 'PrivacyPage', label: 'Polityka prywatności' },
];

export function isEditableKey(key: string) {
  const [namespace, name] = key.split('.');
  const section = EDITABLE_TEXTS.find((s) => s.namespace === namespace);
  return Boolean(
    section && name && (!section.keys || section.keys.includes(name))
  );
}

const tagsOf = (text: string) =>
  [...text.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();
const variablesOf = (text: string) =>
  [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

/**
 * Why an edited text cannot be used, or null. It must keep the default's
 * tags (<link>…</link>) and variables ({date}), and its braces and tags
 * must be balanced, or next-intl would fail to render the page.
 */
export function textProblem(
  defaultValue: string,
  value: string
): string | null {
  if (!value.trim()) return 'Tekst nie może być pusty.';
  const expectedTags = tagsOf(defaultValue);
  const tags = tagsOf(value);
  if (tags.join() !== expectedTags.join()) {
    return expectedTags.length
      ? `Zachowaj znaczniki: ${expectedTags.map((t) => `<${t}>…</${t}>`).join(', ')}.`
      : 'Tekst nie może zawierać znaczników w nawiasach ostrych.';
  }
  for (const tag of tags) {
    if (!new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`).test(value))
      return `Znacznik <${tag}> musi być zamknięty (</${tag}>).`;
  }
  if (variablesOf(value).join() !== variablesOf(defaultValue).join()) {
    const vars = variablesOf(defaultValue);
    return vars.length
      ? `Zachowaj zmienne: ${vars.map((v) => `{${v}}`).join(', ')}.`
      : 'Tekst nie może zawierać nawiasów klamrowych.';
  }
  const opened = (value.match(/\{/g) ?? []).length;
  if (opened !== (value.match(/\}/g) ?? []).length)
    return 'Nawiasy klamrowe są niezamknięte.';
  return null;
}

/** Messages with the panel's edits applied; the files stay the defaults. */
export async function withContentOverrides(
  messages: AbstractIntlMessages,
  locale: string
) {
  let overrides: { key: string; value: string }[] = [];
  try {
    overrides = await prisma.contentOverride.findMany({
      where: { languageCode: locale as 'pl' | 'en' | 'uk' | 'ru' },
      select: { key: true, value: true },
    });
  } catch (err) {
    // Without the database (e.g. during `next build`) the defaults are used
    log.warn({ err }, 'Could not read page text overrides');
    return messages;
  }
  if (overrides.length === 0) return messages;

  const merged = structuredClone(messages) as Record<
    string,
    Record<string, unknown>
  >;
  for (const { key, value } of overrides) {
    const [namespace, name] = key.split('.');
    if (isEditableKey(key) && typeof merged[namespace]?.[name] === 'string') {
      merged[namespace][name] = value;
    }
  }
  return merged as AbstractIntlMessages;
}
