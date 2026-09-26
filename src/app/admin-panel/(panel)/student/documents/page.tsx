import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import {
  deleteDocumentEntry,
  saveDocumentEntry,
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

export const metadata: Metadata = {
  title: 'Statuty i sylabusy · Panel KHZiOS',
};

const FIELDS = [
  {
    name: 'subjectName',
    label: 'Nazwa przedmiotu',
    maxLength: 200,
    required: true,
  },
];

export default async function DocumentsPage() {
  await requireUser();
  const documents = await prisma.studentDocument.findMany({
    include: { translations: true },
    orderBy: [{ displayOrder: 'asc' }, { slug: 'asc' }],
  });

  return (
    <div className={style.page}>
      <h1>Statuty i sylabusy</h1>

      <section className={style.card} aria-labelledby="new-document">
        <h2 id="new-document">Nowy przedmiot</h2>
        <ActionForm
          action={saveDocumentEntry}
          submitLabel="Dodaj przedmiot"
          wide
        >
          <TranslatedFields fields={FIELDS} />
          <div className={formStyle.row}>
            <Field
              label="Statut (PDF)"
              name="statute"
              type="file"
              accept="application/pdf"
              required
            />
            <Field
              label="Sylabus (PDF)"
              name="syllabus"
              type="file"
              accept="application/pdf"
              required
            />
            <Field
              label="Kolejność"
              name="displayOrder"
              type="number"
              min={0}
              max={999}
              defaultValue={documents.length}
            />
          </div>
        </ActionForm>
      </section>

      {documents.map((doc) => {
        const name =
          doc.translations.find((t) => t.languageCode === 'pl')?.subjectName ??
          doc.slug;
        return (
          <details key={doc.id} className={style.card}>
            <summary>
              <strong>{name}</strong>
            </summary>
            <p className={style.inlineActions}>
              <a href={doc.statutePath} target="_blank" rel="noopener">
                Obecny statut
              </a>
              <a href={doc.syllabusPath} target="_blank" rel="noopener">
                Obecny sylabus
              </a>
            </p>
            <ActionForm action={saveDocumentEntry} submitLabel="Zapisz" wide>
              <input type="hidden" name="id" value={doc.id} />
              <TranslatedFields
                fields={FIELDS}
                values={valuesByLanguage(doc.translations)}
              />
              <div className={formStyle.row}>
                <Field
                  label="Nowy statut (PDF)"
                  name="statute"
                  type="file"
                  accept="application/pdf"
                  hint="Zostaw puste, żeby zachować obecny."
                />
                <Field
                  label="Nowy sylabus (PDF)"
                  name="syllabus"
                  type="file"
                  accept="application/pdf"
                  hint="Zostaw puste, żeby zachować obecny."
                />
                <Field
                  label="Kolejność"
                  name="displayOrder"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={doc.displayOrder}
                />
              </div>
            </ActionForm>
            <form action={deleteDocumentEntry}>
              <input type="hidden" name="id" value={doc.id} />
              <ConfirmButton message={`Przenieść „${name}” do kosza?`}>
                Przenieś do kosza
              </ConfirmButton>
            </form>
          </details>
        );
      })}
    </div>
  );
}
