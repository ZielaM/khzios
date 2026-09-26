import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import FormMessage from '../../_components/FormMessage';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Zespoły · Panel KHZiOS' };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const { deleted } = await searchParams;
  const teams = await prisma.team.findMany({
    include: {
      translations: { where: { languageCode: 'pl' } },
      _count: { select: { members: true, publications: true, projects: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className={style.page}>
      <div className={style.header}>
        <h1>Zespoły</h1>
        <Link href={adminHref('/teams/new')}>+ Nowy zespół</Link>
      </div>
      {deleted && <FormMessage message="Zespół przeniesiono do kosza." />}
      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th scope="col">Nazwa</th>
              <th scope="col">Rodzaj</th>
              <th scope="col">Osoby</th>
              <th scope="col">Publikacje</th>
              <th scope="col">Projekty</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={adminHref(`/teams/${t.id}`)}>
                    {t.translations[0]?.name ?? t.slug}
                  </Link>
                </td>
                <td>
                  {t.type === 'EXTERNAL' ? 'zewnętrzny' : 'strona w serwisie'}
                </td>
                <td>{t._count.members}</td>
                <td>{t._count.publications}</td>
                <td>{t._count.projects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {teams.length === 0 && (
        <p className={style.muted}>Nie dodano jeszcze zespołów.</p>
      )}
    </div>
  );
}
