import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { LANGUAGES } from '@/lib/admin/languages';
import { deleteTag } from '../../_actions/tags';
import ConfirmButton from '../../_components/ConfirmButton';
import TagForm from '../../_components/TagForm';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Tagi · Panel KHZiOS' };

export default async function TagsPage() {
  await requireUser();
  const tags = await prisma.tag.findMany({
    include: { translations: true, _count: { select: { news: true } } },
    orderBy: { name: 'asc' },
  });
  const namesOf = (tag?: (typeof tags)[number]) =>
    LANGUAGES.map((l) => ({
      ...l,
      name:
        tag?.translations.find((t) => t.languageCode === l.code)?.name ?? '',
    }));

  return (
    <div className={style.page}>
      <h1>Tagi aktualności</h1>
      <p className={style.muted}>
        Tagi porządkują aktualności i służą jako filtry na liście. Polska nazwa
        jest wymagana; pozostałe pokazują się w innych wersjach językowych.
      </p>

      <section className={style.card} aria-labelledby="new-tag">
        <h2 id="new-tag">Nowy tag</h2>
        <TagForm names={namesOf()} />
      </section>

      {tags.map((tag) => (
        <section
          key={tag.id}
          className={style.card}
          aria-label={`Tag ${tag.name}`}
        >
          <div className={style.header}>
            <h2>{tag.name}</h2>
            <span className={style.muted}>Artykułów: {tag._count.news}</span>
          </div>
          <TagForm id={tag.id} names={namesOf(tag)} />
          <form action={deleteTag}>
            <input type="hidden" name="id" value={tag.id} />
            <ConfirmButton
              message={`Usunąć tag „${tag.name}”? Zniknie ze wszystkich artykułów (${tag._count.news}).`}
            >
              Usuń tag
            </ConfirmButton>
          </form>
        </section>
      ))}
    </div>
  );
}
