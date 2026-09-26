import type { Team, TeamTranslation } from '@/generated/prisma/client';
import { Field, TranslatedFields, valuesByLanguage } from './fields';
import formStyle from './forms.module.scss';

export default function TeamFields({
  team,
}: {
  team?: Team & { translations: TeamTranslation[] };
}) {
  return (
    <>
      <TranslatedFields
        fields={[
          {
            name: 'name',
            label: 'Nazwa zespołu',
            maxLength: 300,
            required: true,
          },
          {
            name: 'slug',
            label: 'Adres strony (puste: z nazwy)',
            maxLength: 80,
          },
          {
            name: 'researchDescription',
            label: 'Czym się zajmuje (kierunki badań)',
            maxLength: 5000,
            multiline: true,
          },
          {
            name: 'teachingDescription',
            label: 'Dydaktyka',
            maxLength: 5000,
            multiline: true,
          },
        ]}
        values={team ? valuesByLanguage(team.translations) : undefined}
      />
      <div className={formStyle.row}>
        <label className={formStyle.field}>
          <span>Rodzaj</span>
          <select name="type" defaultValue={team?.type ?? 'FULL'}>
            <option value="FULL">Strona w serwisie katedry</option>
            <option value="EXTERNAL">Odnośnik do strony zewnętrznej</option>
          </select>
        </label>
        <Field
          label="Kolejność w menu"
          name="displayOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={team?.displayOrder ?? 0}
        />
      </div>
    </>
  );
}
