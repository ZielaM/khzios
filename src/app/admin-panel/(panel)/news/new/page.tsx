import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { LANGUAGES } from '@/lib/admin/languages';
import { resolveTagName } from '@/lib/translations';
import { formatDate } from '@/lib/dates';
import NewsForm from '../../../_components/NewsForm';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Nowa aktualność · Panel KHZiOS' };

export default async function NewNewsPage() {
  await requireUser();
  const tags = await prisma.tag.findMany({
    include: { translations: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className={style.page}>
      <h1>Nowa aktualność</h1>
      <p className={style.muted}>
        Artykuł nieoznaczony jako opublikowany zostaje szkicem i nie jest
        widoczny na stronie.
      </p>
      <NewsForm
        published={false}
        publishedAt={formatDate(new Date(), 'en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })}
        languages={LANGUAGES.map((l) => ({ ...l, title: '', content: '' }))}
        tags={tags.map((t) => ({
          id: t.id,
          label: resolveTagName(t, 'pl'),
          checked: false,
        }))}
      />
    </div>
  );
}
