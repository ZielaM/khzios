'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseDateInput, startOfDayOffset } from '@/lib/dates';
import { logAudit } from '@/lib/admin/audit';
import {
  checkbox,
  field,
  translations,
  type FormState,
} from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { slugify } from '@/lib/admin/slug';
import { saveDocument, UploadError } from '@/lib/admin/storage';
import { deleteMediaIfUnused, moveToTrash } from '@/lib/admin/trash';
import {
  announcementSnapshot,
  consultationSnapshot,
  documentSnapshot,
} from '@/lib/admin/student-admin';

function refresh(section: string) {
  revalidatePublicSite();
  revalidatePath(adminHref(`/student/${section}`));
}

// ──── Announcements ─────────────────────────────────────────────────

export async function saveAnnouncement(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const date = parseDateInput(field(formData, 'date', 10));
  if (!date) return { error: 'Podaj datę ogłoszenia.' };

  const texts = translations(formData, ['title', 'content'], {
    title: 100,
    content: 256,
  });
  const polish = texts.find((t) => t.languageCode === 'pl')?.values;
  if (!polish?.title || !polish.content)
    return { error: 'Tytuł i treść po polsku są wymagane.' };
  if (texts.some((t) => !t.values.title || !t.values.content)) {
    return {
      error:
        'Każda wersja językowa musi mieć tytuł i treść (albo żadnego z nich).',
    };
  }

  const data = {
    date,
    important: checkbox(formData, 'important'),
    translations: {
      create: texts.map(({ languageCode, values }) => ({
        languageCode,
        ...values,
      })),
    },
  };
  if (id) {
    await prisma.$transaction([
      prisma.studentAnnouncementTranslation.deleteMany({
        where: { announcementId: id },
      }),
      prisma.studentAnnouncement.update({ where: { id }, data }),
    ]);
    await logAudit(
      user,
      'update',
      'announcement',
      `Ogłoszenie „${polish.title}”`,
      id
    );
  } else {
    const created = await prisma.studentAnnouncement.create({ data });
    await logAudit(
      user,
      'create',
      'announcement',
      `Ogłoszenie „${polish.title}”`,
      created.id
    );
  }
  refresh('announcements');
  return { message: id ? 'Zapisano.' : 'Dodano ogłoszenie.' };
}

export async function deleteAnnouncement(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  await prisma.$transaction(async (tx) => {
    const snapshot = await announcementSnapshot(tx, id);
    if (!snapshot) return;
    const title =
      snapshot.translations.find((t) => t.languageCode === 'pl')?.title ?? id;
    await moveToTrash(tx, user, {
      entity: 'announcement',
      entityId: id,
      label: `Ogłoszenie „${title}”`,
      data: snapshot,
    });
    await tx.studentAnnouncement.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'announcement',
      `Ogłoszenie „${title}” (do kosza)`,
      id
    );
  });
  refresh('announcements');
}

// ──── Consultations ─────────────────────────────────────────────────

const TIME_PATTERN = /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}$/;

export async function saveConsultation(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const employeeId = field(formData, 'employeeId', 100);
  const date = parseDateInput(field(formData, 'date', 10));
  const time = field(formData, 'time', 20).replace(/\s*[-–]\s*/, ' - ');
  const room = field(formData, 'room', 100) || null;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return { error: 'Wybierz pracownika.' };
  if (!date) return { error: 'Podaj datę.' };
  if (!TIME_PATTERN.test(time))
    return { error: 'Godziny wpisz w formacie 10:00 - 12:00.' };

  const who = `${employee.firstName} ${employee.lastName}`;
  if (id) {
    await prisma.consultation.update({
      where: { id },
      data: { employeeId, date, time, room },
    });
    await logAudit(user, 'update', 'consultation', `Konsultacje: ${who}`, id);
    refresh('consultations');
    return { message: 'Zapisano.' };
  }

  // Optionally the same slot every week until a given day (at most a year)
  const until = parseDateInput(field(formData, 'repeatUntil', 10));
  const dates = [date];
  if (until) {
    for (let week = 1; week <= 52; week++) {
      const next = startOfDayOffset(date, week * 7);
      if (next > until) break;
      dates.push(next);
    }
  }
  await prisma.consultation.createMany({
    data: dates.map((d) => ({ employeeId, date: d, time, room })),
  });
  await logAudit(
    user,
    'create',
    'consultation',
    `Konsultacje: ${who} (${dates.length} ${dates.length === 1 ? 'termin' : 'terminów'})`
  );
  refresh('consultations');
  return {
    message:
      dates.length === 1
        ? 'Dodano termin.'
        : `Dodano ${dates.length} terminów.`,
  };
}

export async function deleteConsultation(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  await prisma.$transaction(async (tx) => {
    const snapshot = await consultationSnapshot(tx, id);
    if (!snapshot) return;
    await moveToTrash(tx, user, {
      entity: 'consultation',
      entityId: id,
      label: `Konsultacje ${snapshot.date.toISOString().slice(0, 10)}, ${snapshot.time}`,
      data: snapshot,
    });
    await tx.consultation.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'consultation',
      'Termin konsultacji (do kosza)',
      id
    );
  });
  refresh('consultations');
}

// ──── Statutes and syllabuses ───────────────────────────────────────

async function optionalPdf(formData: FormData, name: string) {
  const file = formData.get(name);
  return file instanceof File && file.size > 0 ? saveDocument(file) : null;
}

export async function saveDocumentEntry(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const names = translations(formData, ['subjectName'], { subjectName: 200 });
  const polish = names.find((n) => n.languageCode === 'pl')?.values.subjectName;
  if (!polish) return { error: 'Nazwa przedmiotu po polsku jest wymagana.' };
  const displayOrder = Math.max(
    0,
    Math.min(999, Number(field(formData, 'displayOrder', 4)) || 0)
  );

  let statutePath: string | null;
  let syllabusPath: string | null;
  try {
    statutePath = await optionalPdf(formData, 'statute');
    syllabusPath = await optionalPdf(formData, 'syllabus');
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  const translationData = names.map(({ languageCode, values }) => ({
    languageCode,
    subjectName: values.subjectName,
  }));
  if (id) {
    const before = await prisma.studentDocument.findUnique({ where: { id } });
    if (!before) return { error: 'Ten przedmiot już nie istnieje.' };
    await prisma.$transaction([
      prisma.studentDocumentTranslation.deleteMany({
        where: { documentId: id },
      }),
      prisma.studentDocument.update({
        where: { id },
        data: {
          displayOrder,
          ...(statutePath && { statutePath }),
          ...(syllabusPath && { syllabusPath }),
          translations: { create: translationData },
        },
      }),
    ]);
    // Replaced PDFs go unless a trashed item still needs them
    if (statutePath) await deleteMediaIfUnused(before.statutePath);
    if (syllabusPath) await deleteMediaIfUnused(before.syllabusPath);
    await logAudit(
      user,
      'update',
      'document',
      `Statut i sylabus: ${polish}`,
      id
    );
  } else {
    if (!statutePath || !syllabusPath)
      return { error: 'Dodaj oba pliki: statut i sylabus (PDF).' };
    let slug = slugify(polish) || 'przedmiot';
    if (await prisma.studentDocument.findUnique({ where: { slug } }))
      slug = `${slug}-${Date.now().toString(36)}`;
    const created = await prisma.studentDocument.create({
      data: {
        slug,
        displayOrder,
        statutePath,
        syllabusPath,
        translations: { create: translationData },
      },
    });
    await logAudit(
      user,
      'create',
      'document',
      `Statut i sylabus: ${polish}`,
      created.id
    );
  }
  refresh('documents');
  return { message: id ? 'Zapisano.' : 'Dodano przedmiot.' };
}

export async function deleteDocumentEntry(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  await prisma.$transaction(async (tx) => {
    const snapshot = await documentSnapshot(tx, id);
    if (!snapshot) return;
    const name =
      snapshot.translations.find((t) => t.languageCode === 'pl')?.subjectName ??
      snapshot.slug;
    await moveToTrash(tx, user, {
      entity: 'document',
      entityId: id,
      label: `Statut i sylabus: ${name}`,
      data: snapshot,
    });
    await tx.studentDocument.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'document',
      `Statut i sylabus: ${name} (do kosza)`,
      id
    );
  });
  refresh('documents');
}
