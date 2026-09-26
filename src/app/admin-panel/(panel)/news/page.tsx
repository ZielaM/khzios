import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { LANGUAGES } from '@/lib/admin/languages';
import { formatDate } from '@/lib/dates';
import FormMessage from '../../_components/FormMessage';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Aktualności · Panel KHZiOS' };

const PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : '';
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.NewsWhereInput = {
    ...(status === 'draft' && { published: false }),
    ...(status === 'published' && { published: true }),
    ...(q && {
      translations: { some: { title: { contains: q, mode: 'insensitive' } } },
    }),
  };
  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        translations: { select: { languageCode: true, title: true } },
        _count: { select: { photos: true } },
      },
    }),
    prisma.news.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    adminHref(
      `/news?${new URLSearchParams({ ...(status && { status }), ...(q && { q }), page: String(p) })}`
    );

  return (
    <div className={style.page}>
      <div className={style.header}>
        <h1>Aktualności</h1>
        <Link href={adminHref('/news/new')}>+ Nowa aktualność</Link>
      </div>
      {params.deleted && (
        <FormMessage message="Artykuł przeniesiono do kosza." />
      )}

      <form className={style.filters}>
        <label>
          Szukaj w tytułach
          <input name="q" defaultValue={q} type="search" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">Wszystkie</option>
            <option value="published">Opublikowane</option>
            <option value="draft">Szkice</option>
          </select>
        </label>
        <button type="submit">Filtruj</button>
      </form>

      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th scope="col">Tytuł</th>
              <th scope="col">Status</th>
              <th scope="col">Data</th>
              <th scope="col">Wersje językowe</th>
              <th scope="col">Zdjęcia</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const title =
                item.translations.find((t) => t.languageCode === 'pl')?.title ??
                item.translations[0]?.title ??
                '(bez tytułu)';
              return (
                <tr key={item.id}>
                  <td>
                    <Link href={adminHref(`/news/${item.id}`)}>{title}</Link>
                  </td>
                  <td>
                    <span
                      className={`${style.badge} ${item.published ? style.published : ''}`}
                    >
                      {item.published ? 'opublikowany' : 'szkic'}
                    </span>
                  </td>
                  <td>{formatDate(item.publishedAt, 'pl')}</td>
                  <td>
                    <span className={style.languages}>
                      {LANGUAGES.map((l) => {
                        const present = item.translations.some(
                          (t) => t.languageCode === l.code
                        );
                        return (
                          <span
                            key={l.code}
                            className={present ? style.present : undefined}
                            title={`${l.label}: ${present ? 'jest' : 'brak'}`}
                          >
                            {l.code.toUpperCase()}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                  <td>{item._count.photos}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <p className={style.muted}>Brak artykułów spełniających kryteria.</p>
      )}

      {pages > 1 && (
        <nav className={style.pager} aria-label="Strony listy">
          {page > 1 && <Link href={pageHref(page - 1)}>← Poprzednia</Link>}
          <span>
            Strona {page} z {pages}
          </span>
          {page < pages && <Link href={pageHref(page + 1)}>Następna →</Link>}
        </nav>
      )}
    </div>
  );
}
