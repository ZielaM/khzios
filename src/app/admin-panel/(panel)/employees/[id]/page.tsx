import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { deleteEmployee, saveEmployee } from '../../../_actions/people';
import ActionForm from '../../../_components/ActionForm';
import ConfirmButton from '../../../_components/ConfirmButton';
import EmployeeFields from '../../../_components/EmployeeFields';
import FormMessage from '../../../_components/FormMessage';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Pracownik · Panel KHZiOS' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function EmployeePage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  const { created, blocked } = await searchParams;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      translations: true,
      teamMembers: {
        include: {
          team: {
            include: { translations: { where: { languageCode: 'pl' } } },
          },
        },
      },
    },
  });
  if (!employee) notFound();

  return (
    <div className={style.page}>
      <h1>
        {employee.firstName} {employee.lastName}
      </h1>
      {created && (
        <FormMessage message="Utworzono. Dodaj tę osobę do zespołu na stronie zespołu." />
      )}
      {blocked === 'head' && (
        <FormMessage error="Ta osoba jest kierownikiem katedry. Najpierw wskaż innego kierownika w zakładce Kierownictwo i sekretariat." />
      )}

      <ActionForm action={saveEmployee} submitLabel="Zapisz" wide>
        <input type="hidden" name="id" value={employee.id} />
        <EmployeeFields employee={employee} />
      </ActionForm>

      <section className={style.card} aria-labelledby="teams">
        <h2 id="teams">Zespoły</h2>
        {employee.teamMembers.length === 0 ? (
          <p className={style.muted}>Nie należy do żadnego zespołu.</p>
        ) : (
          <ul>
            {employee.teamMembers.map((m) => (
              <li key={m.id}>
                <Link href={adminHref(`/teams/${m.teamId}`)}>
                  {m.team.translations[0]?.name ?? m.team.slug}
                </Link>{' '}
                (
                {m.category === 'ACADEMIC'
                  ? 'naukowo-dydaktyczny'
                  : 'inżynieryjno-techniczny'}
                )
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={style.card} aria-labelledby="danger">
        <h2 id="danger">Usuwanie</h2>
        <p className={style.muted}>
          Osoba zniknie z zespołów i strony; razem z nią jej terminy
          konsultacji. Przez 30 dni można ją przywrócić z kosza.
        </p>
        <form action={deleteEmployee}>
          <input type="hidden" name="id" value={employee.id} />
          <ConfirmButton
            message={`Przenieść ${employee.firstName} ${employee.lastName} do kosza?`}
          >
            Przenieś do kosza
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
