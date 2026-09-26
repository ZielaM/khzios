import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

export function announcementSnapshot(tx: Tx, id: string) {
  return tx.studentAnnouncement.findUnique({
    where: { id },
    include: { translations: true },
  });
}
export type AnnouncementSnapshot = NonNullable<
  Awaited<ReturnType<typeof announcementSnapshot>>
>;

export async function restoreAnnouncement(data: AnnouncementSnapshot) {
  await prisma.studentAnnouncement.create({
    data: {
      id: data.id,
      date: data.date,
      important: data.important,
      createdAt: data.createdAt,
      translations: {
        create: data.translations.map(({ languageCode, title, content }) => ({
          languageCode,
          title,
          content,
        })),
      },
    },
  });
}

export function consultationSnapshot(tx: Tx, id: string) {
  return tx.consultation.findUnique({ where: { id } });
}
export type ConsultationSnapshot = NonNullable<
  Awaited<ReturnType<typeof consultationSnapshot>>
>;

export async function restoreConsultation(data: ConsultationSnapshot) {
  // The employee may have been deleted in the meantime
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
  });
  if (!employee) throw new Error('Pracownik tego terminu już nie istnieje.');
  await prisma.consultation.create({ data });
}

export function documentSnapshot(tx: Tx, id: string) {
  return tx.studentDocument.findUnique({
    where: { id },
    include: { translations: true },
  });
}
export type DocumentSnapshot = NonNullable<
  Awaited<ReturnType<typeof documentSnapshot>>
>;

export async function restoreDocument(data: DocumentSnapshot) {
  await prisma.studentDocument.create({
    data: {
      id: data.id,
      slug: data.slug,
      displayOrder: data.displayOrder,
      statutePath: data.statutePath,
      syllabusPath: data.syllabusPath,
      translations: {
        create: data.translations.map(({ languageCode, subjectName }) => ({
          languageCode,
          subjectName,
        })),
      },
    },
  });
}
