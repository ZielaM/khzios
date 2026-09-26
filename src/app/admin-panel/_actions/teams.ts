'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { MemberCategory, TeamType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, translations, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { slugify } from '@/lib/admin/slug';
import { publicationSnapshot, teamSnapshot } from '@/lib/admin/team-admin';
import { moveToTrash } from '@/lib/admin/trash';

function refresh(teamId?: string) {
  revalidatePublicSite();
  revalidatePath(adminHref('/teams'));
  if (teamId) revalidatePath(adminHref(`/teams/${teamId}`));
}

const ICONS = new Set(['globe', 'facebook', 'instagram', 'link']);
const URL_PATTERN = /^https?:\/\/\S+$/i;

// ──── Team ──────────────────────────────────────────────────────────

export async function saveTeam(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const type: TeamType =
    field(formData, 'type') === 'EXTERNAL' ? 'EXTERNAL' : 'FULL';
  const displayOrder = Math.max(
    0,
    Math.min(999, Number(field(formData, 'displayOrder', 4)) || 0)
  );

  const texts = translations(
    formData,
    ['name', 'slug', 'researchDescription', 'teachingDescription'],
    {
      name: 300,
      slug: 80,
      researchDescription: 5000,
      teachingDescription: 5000,
    }
  );
  const polish = texts.find((t) => t.languageCode === 'pl')?.values;
  if (!polish?.name) return { error: 'Nazwa zespołu po polsku jest wymagana.' };
  if (texts.some((t) => !t.values.name)) {
    return { error: 'Każda wersja językowa zespołu musi mieć nazwę.' };
  }

  // Address of the team page per language, from the name when left empty
  const rows = texts.map(({ languageCode, values }) => ({
    languageCode,
    name: values.name,
    slug: slugify(values.slug || values.name) || 'zespol',
    researchDescription: values.researchDescription || null,
    teachingDescription: values.teachingDescription || null,
  }));
  for (const row of rows) {
    const taken = await prisma.teamTranslation.findFirst({
      where: {
        languageCode: row.languageCode,
        slug: row.slug,
        NOT: id ? { teamId: id } : undefined,
      },
    });
    if (taken) {
      return {
        error: `Adres „${row.slug}” (${row.languageCode.toUpperCase()}) ma już inny zespół. Wpisz inny.`,
      };
    }
  }

  if (id) {
    await prisma.$transaction([
      prisma.teamTranslation.deleteMany({ where: { teamId: id } }),
      prisma.team.update({
        where: { id },
        data: { type, displayOrder, translations: { create: rows } },
      }),
    ]);
    await logAudit(user, 'update', 'team', `Zespół „${polish.name}”`, id);
    refresh(id);
    return { message: 'Zapisano.' };
  }

  // The canonical key never changes: it also names the team's photo section
  let slug = slugify(polish.name, 60) || 'zespol';
  if (await prisma.team.findUnique({ where: { slug } }))
    slug = `${slug}-${Date.now().toString(36)}`;
  const created = await prisma.team.create({
    data: { slug, type, displayOrder, translations: { create: rows } },
  });
  await logAudit(user, 'create', 'team', `Zespół „${polish.name}”`, created.id);
  refresh();
  redirect(adminHref(`/teams/${created.id}?created=1`));
}

export async function deleteTeam(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  await prisma.$transaction(async (tx) => {
    const snapshot = await teamSnapshot(tx, id);
    if (!snapshot) return;
    const name =
      snapshot.translations.find((t) => t.languageCode === 'pl')?.name ??
      snapshot.slug;
    await moveToTrash(tx, user, {
      entity: 'team',
      entityId: id,
      label: `Zespół „${name}”`,
      data: snapshot,
    });
    await tx.team.delete({ where: { id } });
    await logAudit(user, 'delete', 'team', `Zespół „${name}” (do kosza)`, id);
  });
  refresh();
  redirect(adminHref('/teams?deleted=1'));
}

// ──── Members ───────────────────────────────────────────────────────

export async function addMember(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const teamId = field(formData, 'teamId', 100);
  const employeeId = field(formData, 'employeeId', 100);
  const category: MemberCategory =
    field(formData, 'category') === 'TECHNICAL' ? 'TECHNICAL' : 'ACADEMIC';
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return { error: 'Wybierz pracownika.' };
  const exists = await prisma.teamMember.findUnique({
    where: { teamId_employeeId: { teamId, employeeId } },
  });
  if (exists) return { error: 'Ta osoba już należy do zespołu.' };

  await prisma.teamMember.create({ data: { teamId, employeeId, category } });
  await logAudit(
    user,
    'update',
    'team',
    `Dodanie osoby ${employee.firstName} ${employee.lastName} do zespołu`,
    teamId
  );
  refresh(teamId);
  return { message: 'Dodano osobę do zespołu.' };
}

export async function updateMember(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const category: MemberCategory =
    field(formData, 'category') === 'TECHNICAL' ? 'TECHNICAL' : 'ACADEMIC';
  const member = await prisma.teamMember.update({
    where: { id },
    data: { category },
  });
  await logAudit(
    user,
    'update',
    'team',
    'Zmiana grupy pracownika w zespole',
    member.teamId
  );
  refresh(member.teamId);
}

export async function removeMember(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const member = await prisma.teamMember.delete({
    where: { id },
    include: { employee: true },
  });
  await logAudit(
    user,
    'update',
    'team',
    `Usunięcie osoby ${member.employee.firstName} ${member.employee.lastName} z zespołu`,
    member.teamId
  );
  refresh(member.teamId);
}

// ──── Publications ──────────────────────────────────────────────────

export async function savePublication(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const teamId = field(formData, 'teamId', 100) || null;
  const year = Number(field(formData, 'year', 4));
  const authors = field(formData, 'authors', 1000);
  const journal = field(formData, 'journal', 300);
  const doi =
    field(formData, 'doi', 200).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') ||
    null;
  const titles = translations(formData, ['title'], { title: 500 });
  const polishTitle = titles.find((t) => t.languageCode === 'pl')?.values.title;

  if (!polishTitle) return { error: 'Tytuł po polsku jest wymagany.' };
  if (
    !Number.isInteger(year) ||
    year < 1950 ||
    year > new Date().getFullYear() + 1
  ) {
    return { error: 'Podaj rok publikacji.' };
  }
  if (!authors || !journal)
    return { error: 'Autorzy i czasopismo są wymagane.' };
  if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi))
    return { error: 'DOI ma postać 10.xxxx/… (albo pełny adres doi.org).' };
  if (doi) {
    const taken = await prisma.publication.findFirst({
      where: { doi, NOT: id ? { id } : undefined },
    });
    if (taken) return { error: 'Publikacja z tym DOI już istnieje.' };
  }

  const data = {
    year,
    authors,
    journal,
    doi,
    teamId,
    translations: {
      create: titles.map(({ languageCode, values }) => ({
        languageCode,
        title: values.title,
      })),
    },
  };
  if (id) {
    await prisma.$transaction([
      prisma.publicationTranslation.deleteMany({
        where: { publicationId: id },
      }),
      prisma.publication.update({ where: { id }, data }),
    ]);
    await logAudit(
      user,
      'update',
      'publication',
      `Publikacja „${polishTitle}”`,
      id
    );
  } else {
    const created = await prisma.publication.create({ data });
    await logAudit(
      user,
      'create',
      'publication',
      `Publikacja „${polishTitle}”`,
      created.id
    );
  }
  refresh(teamId ?? undefined);
  return { message: id ? 'Zapisano.' : 'Dodano publikację.' };
}

export async function deletePublication(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  let teamId: string | null = null;
  await prisma.$transaction(async (tx) => {
    const snapshot = await publicationSnapshot(tx, id);
    if (!snapshot) return;
    teamId = snapshot.teamId;
    const title =
      snapshot.translations.find((t) => t.languageCode === 'pl')?.title ?? id;
    await moveToTrash(tx, user, {
      entity: 'publication',
      entityId: id,
      label: `Publikacja „${title}”`,
      data: snapshot,
    });
    await tx.publication.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'publication',
      `Publikacja „${title}” (do kosza)`,
      id
    );
  });
  refresh(teamId ?? undefined);
}

// ──── Projects, courses and links (deleted without the trash) ───────

export async function saveProject(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const teamId = field(formData, 'teamId', 100);
  const years = field(formData, 'years', 30);
  const texts = translations(formData, ['title', 'funder'], {
    title: 500,
    funder: 300,
  });
  const polish = texts.find((t) => t.languageCode === 'pl')?.values;
  if (!polish?.title)
    return { error: 'Tytuł projektu po polsku jest wymagany.' };
  if (!/^\d{4}(\s*[–-]\s*(\d{4})?)?$/.test(years))
    return { error: 'Lata wpisz jako 2023, 2022–2025 albo 2024– (trwający).' };
  if (texts.some((t) => !t.values.title))
    return { error: 'Każda wersja językowa musi mieć tytuł.' };

  const data = {
    years: years.replace(/\s*[–-]\s*/, '–'),
    translations: {
      create: texts.map(({ languageCode, values }) => ({
        languageCode,
        title: values.title,
        funder: values.funder || null,
      })),
    },
  };
  if (id) {
    await prisma.$transaction([
      prisma.researchProjectTranslation.deleteMany({
        where: { projectId: id },
      }),
      prisma.researchProject.update({ where: { id }, data }),
    ]);
  } else {
    await prisma.researchProject.create({ data: { ...data, teamId } });
  }
  await logAudit(
    user,
    id ? 'update' : 'create',
    'team',
    `Projekt „${polish.title}”`,
    teamId
  );
  refresh(teamId);
  return { message: id ? 'Zapisano.' : 'Dodano projekt.' };
}

export async function deleteProject(formData: FormData) {
  const user = await requireUser();
  const project = await prisma.researchProject.delete({
    where: { id: field(formData, 'id', 100) },
  });
  await logAudit(user, 'delete', 'team', 'Usunięcie projektu', project.teamId);
  refresh(project.teamId);
}

export async function saveCourse(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const teamId = field(formData, 'teamId', 100);
  const texts = translations(formData, ['name', 'program', 'coordinator'], {
    name: 200,
    program: 200,
    coordinator: 200,
  });
  const polish = texts.find((t) => t.languageCode === 'pl')?.values;
  if (!polish?.name || !polish.program || !polish.coordinator) {
    return {
      error: 'Nazwa, kierunek i kierownik przedmiotu po polsku są wymagane.',
    };
  }
  if (
    texts.some(
      (t) => !t.values.name || !t.values.program || !t.values.coordinator
    )
  ) {
    return { error: 'Każda wersja językowa musi mieć wszystkie trzy pola.' };
  }
  const translationsData = {
    create: texts.map(({ languageCode, values }) => ({
      languageCode,
      ...values,
    })),
  };
  if (id) {
    await prisma.$transaction([
      prisma.teachingCourseTranslation.deleteMany({ where: { courseId: id } }),
      prisma.teachingCourse.update({
        where: { id },
        data: { translations: translationsData },
      }),
    ]);
  } else {
    await prisma.teachingCourse.create({
      data: { teamId, translations: translationsData },
    });
  }
  await logAudit(
    user,
    id ? 'update' : 'create',
    'team',
    `Przedmiot „${polish.name}”`,
    teamId
  );
  refresh(teamId);
  return { message: id ? 'Zapisano.' : 'Dodano przedmiot.' };
}

export async function deleteCourse(formData: FormData) {
  const user = await requireUser();
  const course = await prisma.teachingCourse.delete({
    where: { id: field(formData, 'id', 100) },
  });
  await logAudit(user, 'delete', 'team', 'Usunięcie przedmiotu', course.teamId);
  refresh(course.teamId);
}

export async function saveLink(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const teamId = field(formData, 'teamId', 100);
  const url = field(formData, 'url', 500);
  const icon = ICONS.has(field(formData, 'icon'))
    ? field(formData, 'icon')
    : 'link';
  const displayOrder = Math.max(
    0,
    Math.min(99, Number(field(formData, 'displayOrder', 2)) || 0)
  );
  const labels = translations(formData, ['label'], { label: 100 });
  if (!URL_PATTERN.test(url))
    return { error: 'Podaj pełny adres zaczynający się od https://.' };
  if (!labels.some((l) => l.languageCode === 'pl'))
    return { error: 'Opis linku po polsku jest wymagany.' };

  const data = {
    url,
    icon,
    displayOrder,
    translations: {
      create: labels.map(({ languageCode, values }) => ({
        languageCode,
        label: values.label,
      })),
    },
  };
  if (id) {
    await prisma.$transaction([
      prisma.teamLinkTranslation.deleteMany({ where: { linkId: id } }),
      prisma.teamLink.update({ where: { id }, data }),
    ]);
  } else {
    await prisma.teamLink.create({ data: { ...data, teamId } });
  }
  await logAudit(
    user,
    id ? 'update' : 'create',
    'team',
    `Link zespołu ${url}`,
    teamId
  );
  refresh(teamId);
  return { message: id ? 'Zapisano.' : 'Dodano link.' };
}

export async function deleteLink(formData: FormData) {
  const user = await requireUser();
  const link = await prisma.teamLink.delete({
    where: { id: field(formData, 'id', 100) },
  });
  await logAudit(
    user,
    'delete',
    'team',
    `Usunięcie linku ${link.url}`,
    link.teamId
  );
  refresh(link.teamId);
}
