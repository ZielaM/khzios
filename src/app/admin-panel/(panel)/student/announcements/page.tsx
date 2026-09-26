import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { formatDate } from '@/lib/dates';
import {
  deleteAnnouncement,
  saveAnnouncement,
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

export const metadata: Metadata = { title: 'Ogłoszenia · Panel KHZiOS' };

const FIELDS = [
  { name: 'title', label: 'Tytuł', maxLength: 100, required: true },
  {
    name: 'content',
    label: 'Treść',
    maxLength: 256,
    multiline: true,
    required: true,
  },
];

const ymd = (date: Date) =>
  formatDate(date, 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

export default async function AnnouncementsPage() {
  await requireUser();
  const announcements = await prisma.studentAnnouncement.findMany({
    include: { translations: true },
    orderBy: { date: 'desc' },
    take: 100,
  });

  return (
    <div className={style.page}>
      <h1>Ogłoszenia dla studentów</h1>
      <p className={style.muted}>
        Strefa studenta pokazuje ogłoszenia z datą od tygodnia wstecz do
        tygodnia naprzód; zmiany widać od razu.
      </p>

      <section className={style.card} aria-labelledby="new-announcement">
        <h2 id="new-announcement">Nowe ogłoszenie</h2>
        <ActionForm
          action={saveAnnouncement}
          submitLabel="Dodaj ogłoszenie"
          wide
        >
          <AnnouncementFields />
        </ActionForm>
      </section>

      {announcements.map((a) => {
        const title =
          a.translations.find((t) => t.languageCode === 'pl')?.title ?? '';
        return (
          <details key={a.id} className={style.card}>
            <summary>
              {formatDate(a.date, 'pl')}: <strong>{title}</strong>
              {a.important && <span className={style.badge}> pilne</span>}
            </summary>
            <ActionForm action={saveAnnouncement} submitLabel="Zapisz" wide>
              <input type="hidden" name="id" value={a.id} />
              <AnnouncementFields
                date={ymd(a.date)}
                important={a.important}
                values={valuesByLanguage(a.translations)}
              />
            </ActionForm>
            <form action={deleteAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <ConfirmButton
                message={`Przenieść ogłoszenie „${title}” do kosza?`}
              >
                Przenieś do kosza
              </ConfirmButton>
            </form>
          </details>
        );
      })}
    </div>
  );
}

function AnnouncementFields({
  date = ymd(new Date()),
  important = false,
  values,
}: {
  date?: string;
  important?: boolean;
  values?: Parameters<typeof TranslatedFields>[0]['values'];
}) {
  return (
    <>
      <div className={formStyle.row}>
        <Field
          label="Data"
          name="date"
          type="date"
          defaultValue={date}
          required
        />
        <label className={formStyle.checkboxField}>
          <input type="checkbox" name="important" defaultChecked={important} />
          Pilne
        </label>
      </div>
      <TranslatedFields fields={FIELDS} values={values} />
    </>
  );
}
