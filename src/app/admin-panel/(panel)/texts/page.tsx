import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { EDITABLE_TEXTS } from '@/lib/content-overrides';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Teksty stron · Panel KHZiOS' };

export default async function TextsPage() {
  await requireUser();
  const overrides = await prisma.contentOverride.findMany({
    select: { key: true },
  });

  return (
    <div className={style.page}>
      <h1>Teksty stron</h1>
      <p className={style.muted}>
        Stałe teksty stron w czterech językach. Zmiany widać na stronie od razu;
        w każdej chwili można wrócić do tekstów domyślnych.
      </p>
      <ul>
        {EDITABLE_TEXTS.map((section) => {
          const changed = overrides.filter((o) =>
            o.key.startsWith(`${section.namespace}.`)
          ).length;
          return (
            <li key={section.namespace}>
              <Link href={adminHref(`/texts/${section.namespace}`)}>
                {section.label}
              </Link>
              {changed > 0 && (
                <span className={style.muted}> (zmienionych: {changed})</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
