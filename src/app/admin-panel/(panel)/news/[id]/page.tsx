import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { LANGUAGES } from '@/lib/admin/languages';
import { resolveTagName } from '@/lib/translations';
import { formatDate } from '@/lib/dates';
import { deleteNews, deletePhoto, movePhoto } from '../../../_actions/news';
import ConfirmButton from '../../../_components/ConfirmButton';
import MoveButtons from '../../../_components/MoveButtons';
import NewsForm from '../../../_components/NewsForm';
import { PhotoAltForm, PhotoUploadForm } from '../../../_components/PhotoForms';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = {
  title: 'Edycja aktualności · Panel KHZiOS',
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EditNewsPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  const { created } = await searchParams;

  const [news, tags] = await Promise.all([
    prisma.news.findUnique({
      where: { id },
      include: {
        translations: true,
        tags: { select: { id: true } },
        photos: {
          include: { translations: true },
          orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        },
      },
    }),
    prisma.tag.findMany({
      include: { translations: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  if (!news) notFound();

  const polishTitle = news.translations.find(
    (t) => t.languageCode === 'pl'
  )?.title;

  return (
    <div className={style.page}>
      <div className={style.header}>
        <h1>{polishTitle ?? 'Edycja aktualności'}</h1>
        <div className={style.inlineActions}>
          <Link href={adminHref(`/news/${id}/preview`)}>Podgląd</Link>
          {news.published && (
            <a href={`/pl/aktualnosci/${id}`} target="_blank" rel="noopener">
              Zobacz na stronie
            </a>
          )}
        </div>
      </div>

      <NewsForm
        id={id}
        published={news.published}
        publishedAt={formatDate(news.publishedAt, 'en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })}
        languages={LANGUAGES.map((l) => {
          const t = news.translations.find((tr) => tr.languageCode === l.code);
          return { ...l, title: t?.title ?? '', content: t?.content ?? '' };
        })}
        tags={tags.map((t) => ({
          id: t.id,
          label: resolveTagName(t, 'pl'),
          checked: news.tags.some((nt) => nt.id === t.id),
        }))}
        initialMessage={
          created
            ? news.photos.length
              ? 'Utworzono artykuł. Uzupełnij opisy zdjęć poniżej.'
              : 'Utworzono artykuł. Możesz teraz dodać zdjęcia.'
            : undefined
        }
      />

      <section className={style.card} aria-labelledby="photos">
        <h2 id="photos">Zdjęcia</h2>
        <p className={style.muted}>
          Pierwsze zdjęcie jest zdjęciem głównym artykułu. Opis (tekst
          alternatywny) czytają osoby niewidome i wyszukiwarki, więc opisz, co
          widać na zdjęciu.
        </p>
        {news.photos.map((photo, index) => {
          const missingAlt = !photo.translations.some(
            (t) => t.languageCode === 'pl' && t.alt
          );
          return (
            <div key={photo.id} className={style.photoRow}>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element -- panel thumbnail */}
                <img src={photo.url} alt="" />
                <div className={style.inlineActions}>
                  <MoveButtons
                    action={movePhoto}
                    idField="photoId"
                    id={photo.id}
                    index={index}
                    count={news.photos.length}
                  />
                  <form action={deletePhoto}>
                    <input type="hidden" name="photoId" value={photo.id} />
                    <ConfirmButton message="Usunąć to zdjęcie? Tej operacji nie można cofnąć.">
                      Usuń
                    </ConfirmButton>
                  </form>
                </div>
              </div>
              <div>
                {missingAlt && (
                  <p className={style.warning}>Brak opisu po polsku.</p>
                )}
                <PhotoAltForm
                  photoId={photo.id}
                  alts={LANGUAGES.map((l) => ({
                    ...l,
                    alt:
                      photo.translations.find((t) => t.languageCode === l.code)
                        ?.alt ?? '',
                  }))}
                />
              </div>
            </div>
          );
        })}
        <PhotoUploadForm newsId={id} />
      </section>

      <section className={style.card} aria-labelledby="danger">
        <h2 id="danger">Usuwanie</h2>
        <p className={style.muted}>
          Usunięty artykuł trafia do kosza, skąd można go przywrócić przez 30
          dni.
        </p>
        <form action={deleteNews}>
          <input type="hidden" name="id" value={id} />
          <ConfirmButton message="Przenieść artykuł do kosza?">
            Przenieś do kosza
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
