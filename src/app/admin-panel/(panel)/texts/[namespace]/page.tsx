import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { LANGUAGES } from '@/lib/admin/languages';
import { defaultMessages } from '@/lib/admin/default-messages';
import { EDITABLE_TEXTS } from '@/lib/content-overrides';
import { restoreDefaultTexts, saveTexts } from '../../../_actions/texts';
import ActionForm from '../../../_components/ActionForm';
import ConfirmButton from '../../../_components/ConfirmButton';
import LanguageTabs from '../../../_components/LanguageTabs';
import formStyle from '../../../_components/forms.module.scss';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Teksty stron · Panel KHZiOS' };

const labelFor = (polishDefault: string) => {
  const plain = polishDefault.replace(/<\/?\w+>/g, '').replace(/\s+/g, ' ');
  return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
};

export default async function TextSectionPage({
  params,
}: {
  params: Promise<{ namespace: string }>;
}) {
  await requireUser();
  const { namespace } = await params;
  const section = EDITABLE_TEXTS.find((s) => s.namespace === namespace);
  if (!section) notFound();

  const keys = section.keys ?? Object.keys(defaultMessages.pl[namespace] ?? {});
  const overrides = await prisma.contentOverride.findMany({
    where: { key: { startsWith: `${namespace}.` } },
  });
  const current = (code: string, name: string) =>
    overrides.find(
      (o) => o.key === `${namespace}.${name}` && o.languageCode === code
    )?.value ?? String(defaultMessages[code as 'pl'][namespace]?.[name] ?? '');

  return (
    <div className={style.page}>
      <p>
        <Link href={adminHref('/texts')}>← Wszystkie teksty</Link>
      </p>
      <h1>Teksty: {section.label}</h1>
      <p className={style.muted}>
        Fragmenty w nawiasach ostrych, np. &lt;link&gt;tekst linku&lt;/link&gt;,
        i klamrowych, np. {'{date}'}, muszą zostać: to linki i wartości
        wstawiane przez stronę.
      </p>

      <ActionForm action={saveTexts} submitLabel="Zapisz teksty" wide>
        <input type="hidden" name="namespace" value={namespace} />
        <LanguageTabs
          panels={LANGUAGES.map(({ code, label }) => ({
            code,
            label,
            filled: true,
            content: keys.map((name) => {
              const polishDefault = String(
                defaultMessages.pl[namespace]?.[name] ?? name
              );
              const changed = overrides.some(
                (o) =>
                  o.key === `${namespace}.${name}` && o.languageCode === code
              );
              return (
                <label key={name} className={formStyle.field}>
                  <span>
                    {labelFor(polishDefault)}
                    {changed && <span className={style.badge}> zmieniony</span>}
                  </span>
                  <textarea
                    name={`${name}_${code}`}
                    defaultValue={current(code, name)}
                    rows={polishDefault.length > 120 ? 5 : 2}
                    maxLength={5000}
                  />
                </label>
              );
            }),
          }))}
        />
      </ActionForm>

      {overrides.length > 0 && (
        <form action={restoreDefaultTexts}>
          <input type="hidden" name="namespace" value={namespace} />
          <ConfirmButton
            message={`Przywrócić domyślne teksty sekcji „${section.label}” we wszystkich językach?`}
            variant="secondary"
          >
            Przywróć teksty domyślne
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
