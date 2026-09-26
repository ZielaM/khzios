import type { Employee, EmployeeTranslation } from '@/generated/prisma/client';
import { Field, TranslatedFields, valuesByLanguage } from './fields';
import formStyle from './forms.module.scss';

/** Fields of the employee form (new and edit). */
export default function EmployeeFields({
  employee,
}: {
  employee?: Employee & { translations: EmployeeTranslation[] };
}) {
  return (
    <>
      <div className={formStyle.row}>
        <Field
          label="Imię"
          name="firstName"
          defaultValue={employee?.firstName}
          maxLength={100}
          required
        />
        <Field
          label="Nazwisko"
          name="lastName"
          defaultValue={employee?.lastName}
          maxLength={100}
          required
        />
      </div>
      <TranslatedFields
        fields={[
          {
            name: 'academicTitle',
            label: 'Tytuł lub stopień (np. dr hab.)',
            maxLength: 100,
          },
        ]}
        values={employee ? valuesByLanguage(employee.translations) : undefined}
      />
      <div className={formStyle.row}>
        <Field
          label="E-mail"
          name="email"
          type="email"
          defaultValue={employee?.email ?? ''}
          maxLength={200}
        />
        <Field
          label="Telefon"
          name="phone"
          defaultValue={employee?.phone ?? ''}
          maxLength={50}
        />
        <Field
          label="Pokój"
          name="officeLocation"
          defaultValue={employee?.officeLocation ?? ''}
          maxLength={200}
        />
      </div>
      <div className={formStyle.row}>
        <Field
          label="ORCID"
          name="orcid"
          defaultValue={employee?.orcid ?? ''}
          placeholder="0000-0000-0000-0000"
          maxLength={19}
        />
        <Field
          label="Adres profilu"
          name="profileSlug"
          defaultValue={employee?.profileSlug ?? ''}
          maxLength={100}
          hint="Część adresu strony pracownika. Puste: z imienia i nazwiska."
        />
      </div>
      {employee?.photoUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- panel thumbnail */}
          <img
            src={employee.photoUrl}
            alt=""
            width={120}
            height={120}
            style={{ objectFit: 'cover', borderRadius: '50%' }}
          />
          <label className={formStyle.checkboxField}>
            <input type="checkbox" name="removePhoto" /> Usuń zdjęcie
          </label>
        </div>
      )}
      <Field
        label={employee?.photoUrl ? 'Nowe zdjęcie' : 'Zdjęcie'}
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hint="Zdjęcie portretowe, najlepiej kwadratowe. Dane z aparatu zostaną usunięte."
      />
    </>
  );
}
