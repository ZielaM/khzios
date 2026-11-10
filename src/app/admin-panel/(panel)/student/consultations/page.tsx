import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { WEEKDAYS } from '@/lib/admin/people-admin';
import { requireUser } from '@/lib/admin/session';
import {
  deleteConsultation,
  saveConsultation,
} from '../../../_actions/student';
import ActionForm from '../../../_components/ActionForm';
import ConfirmButton from '../../../_components/ConfirmButton';
import {
  Field,
  TranslatedFields,
  valuesByLanguage,
} from '../../../_components/fields';
import formStyle from '../../../_components/forms.module.scss';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Konsultacje · Panel KHZiOS' };

interface Slot {
  employeeId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
  translations: { languageCode: string; note: string }[];
}

export default async function ConsultationsPage() {
  await requireUser();
  const [employees, consultations] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.consultation.findMany({
      include: { employee: true, translations: true },
      orderBy: [
        { employee: { lastName: 'asc' } },
        { employee: { firstName: 'asc' } },
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    }),
  ]);

  // The same fields for a new slot and for editing one
  const slotFields = (slot?: Slot) => (
    <>
      <label className={formStyle.field}>
        <span>Pracownik *</span>
        <select
          name="employeeId"
          defaultValue={slot?.employeeId ?? ''}
          required
        >
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
      <div className={formStyle.row}>
        <label className={formStyle.field}>
          <span>Dzień tygodnia *</span>
          <select name="weekday" defaultValue={slot?.weekday ?? ''} required>
            <option value="" disabled>
              Wybierz…
            </option>
            {WEEKDAYS.map((d) => (
              <option key={d.order} value={d.order}>
                {d.names.pl}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Od"
          name="startTime"
          type="time"
          defaultValue={slot?.startTime}
          required
        />
        <Field
          label="Do"
          name="endTime"
          type="time"
          defaultValue={slot?.endTime}
          required
        />
        <Field
          label="Miejsce"
          name="room"
          placeholder="pok. 110"
          defaultValue={slot?.room ?? ''}
          maxLength={100}
          hint="Puste: pokój pracownika."
        />
      </div>
      <TranslatedFields
        fields={[
          {
            name: 'note',
            label: 'Uwagi (opcjonalnie, np. po wcześniejszym umówieniu)',
            maxLength: 200,
          },
        ]}
        values={slot ? valuesByLanguage(slot.translations) : {}}
      />
    </>
  );

  return (
    <div className={style.page}>
      <h1>Konsultacje</h1>
      <p className={style.muted}>
        Konsultacje odbywają się co tydzień w podanym dniu i godzinach — także u
        kierownika katedry, którego strona pokazuje te same godziny.
      </p>

      <section className={style.card} aria-labelledby="new-consultation">
        <h2 id="new-consultation">Nowe konsultacje</h2>
        <ActionForm action={saveConsultation} submitLabel="Dodaj">
          {slotFields()}
        </ActionForm>
      </section>

      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th scope="col">Pracownik</th>
              <th scope="col">Dzień</th>
              <th scope="col">Godziny i miejsce</th>
              <th scope="col">Zmiana</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => {
              const note = c.translations.find(
                (t) => t.languageCode === 'pl'
              )?.note;
              return (
                <tr key={c.id}>
                  <td>
                    {c.employee.lastName} {c.employee.firstName}
                  </td>
                  <td>
                    {WEEKDAYS.find((d) => d.order === c.weekday)?.names.pl}
                  </td>
                  <td>
                    {c.startTime}–{c.endTime}
                    {c.room && `, ${c.room}`}
                    {note && <div className={style.muted}>{note}</div>}
                  </td>
                  <td>
                    <details>
                      <summary>Edytuj</summary>
                      <ActionForm
                        action={saveConsultation}
                        submitLabel="Zapisz"
                      >
                        <input type="hidden" name="id" value={c.id} />
                        {slotFields(c)}
                      </ActionForm>
                      <form action={deleteConsultation}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton message="Przenieść te konsultacje do kosza?">
                          Usuń
                        </ConfirmButton>
                      </form>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {consultations.length === 0 && (
        <p className={style.muted}>Brak konsultacji.</p>
      )}
    </div>
  );
}
