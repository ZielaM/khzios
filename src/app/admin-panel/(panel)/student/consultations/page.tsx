import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { formatDate, startOfDayOffset } from '@/lib/dates';
import {
  deleteConsultation,
  saveConsultation,
} from '../../../_actions/student';
import ActionForm from '../../../_components/ActionForm';
import ConfirmButton from '../../../_components/ConfirmButton';
import { Field } from '../../../_components/fields';
import formStyle from '../../../_components/forms.module.scss';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Konsultacje · Panel KHZiOS' };

const ymd = (date: Date) =>
  formatDate(date, 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

export default async function ConsultationsPage() {
  await requireUser();
  const [employees, consultations] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.consultation.findMany({
      // Past terms from the last month stay visible for corrections
      where: { date: { gte: startOfDayOffset(new Date(), -31) } },
      include: { employee: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    }),
  ]);

  const employeeSelect = (selected?: string) => (
    <label className={formStyle.field}>
      <span>Pracownik *</span>
      <select name="employeeId" defaultValue={selected ?? ''} required>
        <option value="" disabled>
          Wybierz…
        </option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.lastName} {e.firstName}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={style.page}>
      <h1>Konsultacje</h1>

      <section className={style.card} aria-labelledby="new-consultation">
        <h2 id="new-consultation">Nowy termin</h2>
        <ActionForm action={saveConsultation} submitLabel="Dodaj">
          {employeeSelect()}
          <div className={formStyle.row}>
            <Field
              label="Data"
              name="date"
              type="date"
              defaultValue={ymd(new Date())}
              required
            />
            <Field
              label="Godziny"
              name="time"
              placeholder="10:00 - 12:00"
              required
            />
            <Field
              label="Miejsce"
              name="room"
              placeholder="pok. 110"
              maxLength={100}
            />
          </div>
          <Field
            label="Powtarzaj co tydzień do"
            name="repeatUntil"
            type="date"
            hint="Opcjonalnie: ten sam termin w kolejnych tygodniach, najdłużej przez rok."
          />
        </ActionForm>
      </section>

      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Pracownik</th>
              <th scope="col">Godziny i miejsce</th>
              <th scope="col">Zmiana</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id}>
                <td>
                  {formatDate(c.date, 'pl', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </td>
                <td>
                  {c.employee.firstName} {c.employee.lastName}
                </td>
                <td>
                  {c.time}
                  {c.room && `, ${c.room}`}
                </td>
                <td>
                  <details>
                    <summary>Edytuj</summary>
                    <ActionForm action={saveConsultation} submitLabel="Zapisz">
                      <input type="hidden" name="id" value={c.id} />
                      {employeeSelect(c.employeeId)}
                      <Field
                        label="Data"
                        name="date"
                        type="date"
                        defaultValue={ymd(c.date)}
                        required
                      />
                      <Field
                        label="Godziny"
                        name="time"
                        defaultValue={c.time}
                        required
                      />
                      <Field
                        label="Miejsce"
                        name="room"
                        defaultValue={c.room ?? ''}
                        maxLength={100}
                      />
                    </ActionForm>
                    <form action={deleteConsultation}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton message="Przenieść ten termin do kosza?">
                        Usuń termin
                      </ConfirmButton>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {consultations.length === 0 && (
        <p className={style.muted}>Brak terminów.</p>
      )}
    </div>
  );
}
