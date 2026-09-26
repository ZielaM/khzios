import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { LANGUAGES } from '@/lib/admin/languages';
import { formatDate } from '@/lib/dates';
import { sanitizeArticleHtml, sanitizeInlineHtml } from '@/lib/content-utils';
import articleStyle from '@/app/[locale]/news/[id]/page.module.scss';
import style from '../../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Podgląd · Panel KHZiOS' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

/** The article as readers will see it, also before it is published. */
export default async function NewsPreviewPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  const { lang = 'pl' } = await searchParams;
  const news = await prisma.news.findUnique({
    where: { id },
    include: {
      translations: true,
      photos: { orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }], take: 1 },
    },
  });
  if (!news) notFound();

  const translation =
    news.translations.find((t) => t.languageCode === lang) ??
    news.translations.find((t) => t.languageCode === 'pl');

  return (
    <div className={style.page}>
      <div className={style.header}>
        <p>
          <Link href={adminHref(`/news/${id}`)}>← Wróć do edycji</Link>
          {!news.published && (
            <span className={style.badge}> szkic, niewidoczny na stronie</span>
          )}
        </p>
        <nav className={style.inlineActions} aria-label="Język podglądu">
          {LANGUAGES.filter((l) =>
            news.translations.some((t) => t.languageCode === l.code)
          ).map((l) => (
            <Link
              key={l.code}
              href={adminHref(`/news/${id}/preview?lang=${l.code}`)}
              aria-current={l.code === lang ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <article
        className={articleStyle.article}
        style={{ background: 'var(--background)', padding: '2rem' }}
      >
        <header className={articleStyle.header}>
          <h1
            className={articleStyle.title}
            dangerouslySetInnerHTML={{
              __html: sanitizeInlineHtml(translation?.title ?? ''),
            }}
          />
          <div className={articleStyle.meta}>
            <time dateTime={news.publishedAt.toISOString()}>
              {formatDate(news.publishedAt, lang)}
            </time>
          </div>
        </header>
        {news.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- preview only
          <img
            src={news.photos[0].url}
            alt=""
            style={{
              width: '100%',
              maxHeight: 480,
              objectFit: 'cover',
              margin: '2rem 0',
            }}
          />
        )}
        <div
          className={articleStyle.content}
          dangerouslySetInnerHTML={{
            __html: sanitizeArticleHtml(translation?.content ?? ''),
          }}
        />
      </article>
    </div>
  );
}
