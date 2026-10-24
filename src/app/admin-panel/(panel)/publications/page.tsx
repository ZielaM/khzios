import type { Metadata } from 'next';
import Link from 'next/link';
import type {
  Prisma,
  Publication,
  PublicationTeam,
  PublicationTranslation,
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { deletePublication, savePublication } from '../../_actions/teams';
import ActionForm from '../../_components/ActionForm';
import ConfirmButton from '../../_components/ConfirmButton';
import {
  Field,
  TranslatedFields,
  valuesByLanguage,
} from '../../_components/fields';
import formStyle from '../../_components/forms.module.scss';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Publikacje · Panel KHZiOS' };

const PAGE_SIZE = 25;

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const team = params.team ?? '';
  const q = (params.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.PublicationWhereInput = {
    ...(team === 'none'
      ? { teams: { none: {} } }
      : team
        ? { teams: { some: { teamId: team } } }
        : {}),
    ...(q && {
      OR: [
        {
          translations: {
            some: { title: { contains: q, mode: 'insensitive' } },
          },
        },
        { authors: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };
  const [teams, publications, total] = await Promise.all([
    prisma.team.findMany({
      include: { translations: { where: { languageCode: 'pl' } } },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.publication.findMany({
      where,
      include: { translations: true, teams: true },
      orderBy: [{ year: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.publication.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) =>
    adminHref(
      `/publications?${new URLSearchParams({ ...(team && { team }), ...(q && { q }), page: String(p) })}`
    );
  const teamName = (t: (typeof teams)[number]) =>
    t.translations[0]?.name ?? t.slug;
  // In menu order, whatever order the links were saved in
  const teamNames = (links: PublicationTeam[]) =>
    teams
      .filter((t) => links.some((link) => link.teamId === t.id))
      .map(teamName)
      .join(', ') || 'bez zespołu';

  const teamChecks = (selected: string[]) => (
    <fieldset className={formStyle.fieldset}>
      <legend>Zespoły</legend>
      {teams.map((t) => (
        <label key={t.id} className={formStyle.checkboxField}>
          <input
            type="checkbox"
            name="teams"
            value={t.id}
            defaultChecked={selected.includes(t.id)}
          />
          {teamName(t)}
        </label>
      ))}
      <small>
        Publikacja wspólna kilku zespołów pojawi się na stronie każdego z nich.
        Bez zespołu będzie tylko na stronie „Publikacje naukowe”.
      </small>
    </fieldset>
  );

  const publicationFields = (
    p?: Publication & {
      translations: PublicationTranslation[];
      teams: PublicationTeam[];
    }
  ) => (
    <>
      <TranslatedFields
        fields={[
          { name: 'title', label: 'Tytuł', maxLength: 500, required: true },
        ]}
        values={p ? valuesByLanguage(p.translations) : undefined}
      />
      <Field
        label="Autorzy"
        name="authors"
        defaultValue={p?.authors}
        maxLength={1000}
        required
        hint="Np. Kowalska A., Nowak T."
      />
      <div className={formStyle.row}>
        <Field
          label="Czasopismo"
          name="journal"
          defaultValue={p?.journal}
          maxLength={300}
          required
        />
        <Field
          label="Rok"
          name="year"
          type="number"
          min={1950}
          max={2100}
          defaultValue={p?.year ?? new Date().getFullYear()}
          required
        />
        <Field
          label="DOI"
          name="doi"
          defaultValue={p?.doi ?? ''}
          maxLength={200}
          placeholder="10.xxxx/…"
        />
      </div>
      {teamChecks(
        p
          ? p.teams.map((link) => link.teamId)
          : team && team !== 'none'
            ? [team]
            : []
      )}
    </>
  );

  return (
    <div className={style.page}>
      <h1>Publikacje</h1>
      <p className={style.muted}>
        Strony zespołów pokazują publikacje z ostatnich 5 lat; strona
        „Publikacje naukowe” wszystkie, z wyszukiwarką.
      </p>

      <form className={style.filters}>
        <label>
          Zespół
          <select name="team" defaultValue={team}>
            <option value="">Wszystkie</option>
            <option value="none">Bez zespołu</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {teamName(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Szukaj (tytuł, autorzy)
          <input name="q" type="search" defaultValue={q} />
        </label>
        <button
          type="submit"
          className={`${formStyle.button} ${formStyle.secondary}`}
        >
          Filtruj
        </button>
      </form>

      <details className={style.card}>
        <summary>Dodaj publikację</summary>
        <ActionForm
          action={savePublication}
          submitLabel="Dodaj publikację"
          wide
        >
          {publicationFields()}
        </ActionForm>
      </details>

      {publications.map((p) => {
        const title =
          p.translations.find((t) => t.languageCode === 'pl')?.title ??
          '(bez tytułu)';
        return (
          <details key={p.id} className={style.card}>
            <summary>
              {p.year}: {title}{' '}
              <span className={style.muted}>({teamNames(p.teams)})</span>
            </summary>
            <ActionForm action={savePublication} submitLabel="Zapisz" wide>
              <input type="hidden" name="id" value={p.id} />
              {publicationFields(p)}
            </ActionForm>
            <form action={deletePublication}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message="Przenieść publikację do kosza?">
                Przenieś do kosza
              </ConfirmButton>
            </form>
          </details>
        );
      })}
      {publications.length === 0 && (
        <p className={style.muted}>Brak publikacji spełniających kryteria.</p>
      )}
      {pages > 1 && (
        <nav className={style.pager} aria-label="Strony listy">
          {page > 1 && <Link href={pageHref(page - 1)}>← Poprzednia</Link>}
          <span>
            Strona {page} z {pages} ({total})
          </span>
          {page < pages && <Link href={pageHref(page + 1)}>Następna →</Link>}
        </nav>
      )}
    </div>
  );
}
