import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { teamHref } from '@/lib/team-routes';
import { getPathname } from '@/i18n/routing';
import {
  addMember,
  deleteCourse,
  deleteLink,
  deleteProject,
  deleteTeam,
  removeMember,
  saveCourse,
  saveLink,
  saveProject,
  saveTeam,
  updateMember,
} from '../../../_actions/teams';
import ActionForm from '../../../_components/ActionForm';
import ConfirmButton from '../../../_components/ConfirmButton';
import {
  Field,
  TranslatedFields,
  valuesByLanguage,
} from '../../../_components/fields';
import FormMessage from '../../../_components/FormMessage';
import TeamFields from '../../../_components/TeamFields';
import formStyle from '../../../_components/forms.module.scss';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Zespół · Panel KHZiOS' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

const PROJECT_FIELDS = [
  { name: 'title', label: 'Tytuł projektu', maxLength: 500, required: true },
  { name: 'funder', label: 'Finansowanie', maxLength: 300 },
];
const COURSE_FIELDS = [
  { name: 'name', label: 'Nazwa przedmiotu', maxLength: 200, required: true },
  {
    name: 'program',
    label: 'Kierunek i stopień studiów',
    maxLength: 200,
    required: true,
  },
  {
    name: 'coordinator',
    label: 'Kierownik przedmiotu',
    maxLength: 200,
    required: true,
  },
];

export default async function TeamPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  const { created } = await searchParams;
  const [team, employees] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: {
        translations: true,
        members: {
          include: { employee: true },
          orderBy: { employee: { lastName: 'asc' } },
        },
        projects: {
          include: { translations: true },
          orderBy: { years: 'desc' },
        },
        courses: { include: { translations: true } },
        links: {
          include: { translations: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: { select: { publications: true } },
      },
    }),
    prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ]);
  if (!team) notFound();

  const name =
    team.translations.find((t) => t.languageCode === 'pl')?.name ?? team.slug;
  const memberIds = new Set(team.members.map((m) => m.employeeId));
  const publicUrl = getPathname({ locale: 'pl', href: teamHref(team, 'pl') });

  return (
    <div className={style.page}>
      <div className={style.header}>
        <h1>{name}</h1>
        <a href={publicUrl} target="_blank" rel="noopener">
          Zobacz na stronie
        </a>
      </div>
      {created && (
        <FormMessage message="Utworzono zespół. Dodaj osoby, projekty i przedmioty poniżej." />
      )}

      <ActionForm action={saveTeam} submitLabel="Zapisz" wide>
        <input type="hidden" name="id" value={team.id} />
        <TeamFields team={team} />
      </ActionForm>

      <section className={style.card} aria-labelledby="members">
        <h2 id="members">Skład ({team.members.length})</h2>
        {team.members.map((m) => (
          <div key={m.id} className={style.header}>
            <Link href={adminHref(`/employees/${m.employeeId}`)}>
              {m.employee.firstName} {m.employee.lastName}
            </Link>
            <div className={style.inlineActions}>
              <form action={updateMember} className={style.inlineActions}>
                <input type="hidden" name="id" value={m.id} />
                <select
                  name="category"
                  defaultValue={m.category}
                  aria-label={`Grupa: ${m.employee.firstName} ${m.employee.lastName}`}
                >
                  <option value="ACADEMIC">naukowo-dydaktyczny</option>
                  <option value="TECHNICAL">inżynieryjno-techniczny</option>
                </select>
                <button
                  type="submit"
                  className={`${formStyle.button} ${formStyle.secondary}`}
                >
                  Zmień
                </button>
              </form>
              <form action={removeMember}>
                <input type="hidden" name="id" value={m.id} />
                <ConfirmButton
                  message={`Usunąć ${m.employee.firstName} ${m.employee.lastName} z zespołu?`}
                >
                  Usuń z zespołu
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
        <ActionForm action={addMember} submitLabel="Dodaj do zespołu">
          <input type="hidden" name="teamId" value={team.id} />
          <div className={formStyle.row}>
            <label className={formStyle.field}>
              <span>Pracownik</span>
              <select name="employeeId" defaultValue="" required>
                <option value="" disabled>
                  Wybierz…
                </option>
                {employees
                  .filter((e) => !memberIds.has(e.id))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.lastName} {e.firstName}
                    </option>
                  ))}
              </select>
            </label>
            <label className={formStyle.field}>
              <span>Grupa</span>
              <select name="category" defaultValue="ACADEMIC">
                <option value="ACADEMIC">naukowo-dydaktyczni</option>
                <option value="TECHNICAL">inżynieryjno-techniczni</option>
              </select>
            </label>
          </div>
        </ActionForm>
      </section>

      <section className={style.card} aria-labelledby="publications">
        <h2 id="publications">Publikacje ({team._count.publications})</h2>
        <p>
          <Link href={adminHref(`/publications?team=${team.id}`)}>
            Zarządzaj publikacjami zespołu
          </Link>
        </p>
      </section>

      <section className={style.card} aria-labelledby="projects">
        <h2 id="projects">Projekty badawcze</h2>
        {team.projects.map((p) => (
          <details key={p.id}>
            <summary>
              {p.years}:{' '}
              {p.translations.find((t) => t.languageCode === 'pl')?.title}
            </summary>
            <ActionForm action={saveProject} submitLabel="Zapisz" wide>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="teamId" value={team.id} />
              <Field
                label="Lata"
                name="years"
                defaultValue={p.years}
                required
              />
              <TranslatedFields
                fields={PROJECT_FIELDS}
                values={valuesByLanguage(p.translations)}
              />
            </ActionForm>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message="Usunąć ten projekt? Tej operacji nie można cofnąć.">
                Usuń projekt
              </ConfirmButton>
            </form>
          </details>
        ))}
        <details>
          <summary>Dodaj projekt</summary>
          <ActionForm action={saveProject} submitLabel="Dodaj projekt" wide>
            <input type="hidden" name="teamId" value={team.id} />
            <Field
              label="Lata"
              name="years"
              placeholder="2024–2027"
              required
              hint="Np. 2023, 2022–2025 albo 2024– dla trwającego."
            />
            <TranslatedFields fields={PROJECT_FIELDS} />
          </ActionForm>
        </details>
      </section>

      <section className={style.card} aria-labelledby="courses">
        <h2 id="courses">Przedmioty</h2>
        {team.courses.map((c) => (
          <details key={c.id}>
            <summary>
              {c.translations.find((t) => t.languageCode === 'pl')?.name}
            </summary>
            <ActionForm action={saveCourse} submitLabel="Zapisz" wide>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="teamId" value={team.id} />
              <TranslatedFields
                fields={COURSE_FIELDS}
                values={valuesByLanguage(c.translations)}
              />
            </ActionForm>
            <form action={deleteCourse}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton message="Usunąć ten przedmiot? Tej operacji nie można cofnąć.">
                Usuń przedmiot
              </ConfirmButton>
            </form>
          </details>
        ))}
        <details>
          <summary>Dodaj przedmiot</summary>
          <ActionForm action={saveCourse} submitLabel="Dodaj przedmiot" wide>
            <input type="hidden" name="teamId" value={team.id} />
            <TranslatedFields fields={COURSE_FIELDS} />
          </ActionForm>
        </details>
      </section>

      {/* Only the page of an external team shows links (to its own site) */}
      {team.type === 'EXTERNAL' ? (
        <section className={style.card} aria-labelledby="links">
          <h2 id="links">Linki zewnętrzne</h2>
          <p className={style.muted}>
            Strona zespołu pokazuje tylko informację o przekierowaniu i te
            linki, więc dodaj co najmniej jeden.
          </p>
          {team.links.length === 0 && (
            <p className={style.warning}>Brak linków.</p>
          )}
          {team.links.map((l) => (
            <details key={l.id}>
              <summary>{l.url}</summary>
              <ActionForm action={saveLink} submitLabel="Zapisz" wide>
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="teamId" value={team.id} />
                <LinkFields
                  url={l.url}
                  icon={l.icon}
                  displayOrder={l.displayOrder}
                />
                <TranslatedFields
                  fields={[
                    {
                      name: 'label',
                      label: 'Opis linku',
                      maxLength: 100,
                      required: true,
                    },
                  ]}
                  values={valuesByLanguage(l.translations)}
                />
              </ActionForm>
              <form action={deleteLink}>
                <input type="hidden" name="id" value={l.id} />
                <ConfirmButton message="Usunąć ten link?">
                  Usuń link
                </ConfirmButton>
              </form>
            </details>
          ))}
          <details>
            <summary>Dodaj link</summary>
            <ActionForm action={saveLink} submitLabel="Dodaj link" wide>
              <input type="hidden" name="teamId" value={team.id} />
              <LinkFields />
              <TranslatedFields
                fields={[
                  {
                    name: 'label',
                    label: 'Opis linku',
                    maxLength: 100,
                    required: true,
                  },
                ]}
              />
            </ActionForm>
          </details>
        </section>
      ) : (
        team.links.length > 0 && (
          <p className={style.muted}>
            Zespół ma zapisane linki zewnętrzne ({team.links.length}), ale
            strona zespołu w serwisie katedry ich nie pokazuje. Widać je po
            zmianie rodzaju na „Odnośnik do strony zewnętrznej”.
          </p>
        )
      )}

      <section className={style.card} aria-labelledby="danger">
        <h2 id="danger">Usuwanie</h2>
        <p className={style.muted}>
          Zespół z projektami, przedmiotami i linkami trafi do kosza (30 dni).
          Publikacje zostaną, ale bez przypisania do zespołu, do czasu
          przywrócenia.
        </p>
        <form action={deleteTeam}>
          <input type="hidden" name="id" value={team.id} />
          <ConfirmButton message={`Przenieść zespół „${name}” do kosza?`}>
            Przenieś do kosza
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}

function LinkFields({
  url = 'https://',
  icon = 'globe',
  displayOrder = 0,
}: {
  url?: string;
  icon?: string;
  displayOrder?: number;
}) {
  return (
    <div className={formStyle.row}>
      <Field
        label="Adres"
        name="url"
        type="url"
        defaultValue={url}
        maxLength={500}
        required
      />
      <label className={formStyle.field}>
        <span>Ikona</span>
        <select name="icon" defaultValue={icon}>
          <option value="globe">strona WWW</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="link">inny link</option>
        </select>
      </label>
      <Field
        label="Kolejność"
        name="displayOrder"
        type="number"
        min={0}
        max={99}
        defaultValue={displayOrder}
      />
    </div>
  );
}
