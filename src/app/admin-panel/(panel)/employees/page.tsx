import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import FormMessage from '../../_components/FormMessage';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Pracownicy · Panel KHZiOS' };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const { deleted } = await searchParams;
  const employees = await prisma.employee.findMany({
    include: {
      translations: { where: { languageCode: 'pl' } },
      teamMembers: {
        include: {
          team: {
            include: { translations: { where: { languageCode: 'pl' } } },
          },
        },
      },
      departmentHead: { select: { id: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return (
    <div className={style.page}>
      <div className={style.header}>
        <h1>Pracownicy</h1>
        <Link href={adminHref('/employees/new')}>+ Nowy pracownik</Link>
      </div>
      {deleted && <FormMessage message="Pracownika przeniesiono do kosza." />}
      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th scope="col">Imię i nazwisko</th>
              <th scope="col">Zespoły</th>
              <th scope="col">Kontakt</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={adminHref(`/employees/${e.id}`)}>
                    {e.translations[0]?.academicTitle &&
                      `${e.translations[0].academicTitle} `}
                    {e.firstName} {e.lastName}
                  </Link>
                  {e.departmentHead && (
                    <span className={style.badge}> kierownik katedry</span>
                  )}
                </td>
                <td>
                  {e.teamMembers
                    .map((m) => m.team.translations[0]?.name ?? m.team.slug)
                    .join(', ') || '—'}
                </td>
                <td>{e.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {employees.length === 0 && (
        <p className={style.muted}>Nie dodano jeszcze pracowników.</p>
      )}
    </div>
  );
}
