import type { AdminUser, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { deleteMedia, MEDIA_PREFIX } from './storage';

/** Deleted items can be restored for this many days. */
export const TRASH_DAYS = 30;

type Tx = Prisma.TransactionClient;

/** Saves a snapshot of a record before it is deleted. */
export function moveToTrash(
  tx: Tx,
  user: Pick<AdminUser, 'login'>,
  item: { entity: string; entityId: string; label: string; data: unknown }
) {
  return tx.trashItem.create({
    data: {
      entity: item.entity,
      entityId: item.entityId,
      label: item.label.slice(0, 300),
      // Plain JSON: dates become ISO strings, which Prisma accepts back
      data: JSON.parse(JSON.stringify(item.data)) as Prisma.InputJsonValue,
      deletedBy: user.login,
    },
  });
}

/** Every uploaded file URL inside a snapshot (photos, PDFs). */
export function mediaUrlsIn(data: unknown): string[] {
  const urls: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === 'string' && value.startsWith(MEDIA_PREFIX))
      urls.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(walk);
  };
  walk(data);
  return urls;
}

/** Whether a file is still used by any record (or another trashed item). */
export async function isMediaUsed(url: string, exceptTrashId?: string) {
  const [photos, employees, documents, siteImages, trash] = await Promise.all([
    prisma.photo.count({ where: { url } }),
    prisma.employee.count({ where: { photoUrl: url } }),
    prisma.studentDocument.count({
      where: { OR: [{ statutePath: url }, { syllabusPath: url }] },
    }),
    prisma.siteImage.count({ where: { url } }),
    // File names only contain [a-z0-9-.], so LIKE needs no escaping
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "TrashItem"
      WHERE id <> ${exceptTrashId ?? ''} AND data::text LIKE ${`%${url}%`}`,
  ]);
  return (
    photos + employees + documents + siteImages + Number(trash[0].count) > 0
  );
}

/** Deletes a trashed item for good, with files nothing else uses. */
export async function purgeTrashItem(id: string) {
  const item = await prisma.trashItem.findUnique({ where: { id } });
  if (!item) return;
  const urls = mediaUrlsIn(item.data);
  await prisma.trashItem.delete({ where: { id } });
  for (const url of urls) {
    if (!(await isMediaUsed(url, id))) await deleteMedia(url);
  }
}

/** Removes items older than TRASH_DAYS; called when the panel is used. */
export async function purgeExpiredTrash() {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000);
  const expired = await prisma.trashItem.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true },
  });
  for (const { id } of expired) await purgeTrashItem(id);
}

/** Deletes a replaced or removed upload unless something still uses it. */
export async function deleteMediaIfUnused(url: string | null | undefined) {
  if (url && !(await isMediaUsed(url))) await deleteMedia(url);
}
