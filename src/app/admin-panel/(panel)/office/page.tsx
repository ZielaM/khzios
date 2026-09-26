import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { saveHead, saveSecretariat } from '../../_actions/office';
import ActionForm from '../../_components/ActionForm';
import {
  Field,
  hoursByDay,
  TranslatedFields,
  valuesByLanguage,
  WeeklyHoursFields,
} from '../../_components/fields';
import formStyle from '../../_components/forms.module.scss';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = {
  title: 'Kierownictwo i sekretariat · Panel KHZiOS',
};

const hoursInclude = {
  include: { translations: true },
  orderBy: { displayOrder: 'asc' as const },
};

export default async function OfficePage() {
  await requireUser();
  const [employees, head, secretariat] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.departmentHead.findFirst({
      include: { workingHours: hoursInclude },
    }),
    prisma.secretariat.findFirst({
      include: { translations: true, workingHours: hoursInclude },
    }),
  ]);

  return (
    <div className={style.page}>
      <h1>Kierownictwo i sekretariat</h1>

      <section className={style.card} aria-labelledby="head">
        <h2 id="head">Kierownik katedry</h2>
        <p className={style.muted}>
          Dane kontaktowe i zdjęcie pochodzą z profilu pracownika.
        </p>
        <ActionForm action={saveHead} submitLabel="Zapisz" wide>
          <label className={formStyle.field}>
            <span>Kierownik *</span>
            <select
              name="employeeId"
              defaultValue={head?.employeeId ?? ''}
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
          <WeeklyHoursFields
            legend="Godziny konsultacji"
            hours={head ? hoursByDay(head.workingHours) : []}
          />
        </ActionForm>
      </section>

      <section className={style.card} aria-labelledby="secretariat">
        <h2 id="secretariat">Sekretariat</h2>
        <ActionForm action={saveSecretariat} submitLabel="Zapisz" wide>
          <TranslatedFields
            fields={[
              {
                name: 'title',
                label: 'Nazwa (np. Sekretariat Katedry)',
                maxLength: 200,
                required: true,
              },
            ]}
            values={
              secretariat
                ? valuesByLanguage(secretariat.translations)
                : undefined
            }
          />
          <div className={formStyle.row}>
            <Field
              label="E-mail"
              name="email"
              type="email"
              defaultValue={secretariat?.email ?? ''}
              maxLength={200}
            />
            <Field
              label="Telefon"
              name="phone"
              defaultValue={secretariat?.phone ?? ''}
              maxLength={50}
            />
            <Field
              label="Lokalizacja biura"
              name="officeLocation"
              defaultValue={secretariat?.officeLocation ?? ''}
              maxLength={200}
            />
          </div>
          {secretariat?.photoUrl && (
            <label className={formStyle.checkboxField}>
              <input type="checkbox" name="removePhoto" /> Usuń obecne zdjęcie
            </label>
          )}
          <Field
            label="Zdjęcie (opcjonalnie)"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
          <WeeklyHoursFields
            legend="Godziny pracy"
            hours={secretariat ? hoursByDay(secretariat.workingHours) : []}
          />
        </ActionForm>
      </section>
    </div>
  );
}
