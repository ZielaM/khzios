'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { TRASH_ENTITIES } from '@/lib/admin/restore';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { purgeTrashItem } from '@/lib/admin/trash';

export async function restoreTrashItem(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const item = await prisma.trashItem.findUnique({
    where: { id: field(formData, 'id', 100) },
  });
  if (!item) return { error: 'Tego elementu nie ma już w koszu.' };
  const entity = TRASH_ENTITIES[item.entity];
  if (!entity) return { error: 'Nie można przywrócić tego rodzaju elementu.' };

  try {
    await entity.restore(item.data as never);
  } catch (err) {
    // Typically a clash: something with the same address or DOI exists again
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return {
        error:
          'Nie udało się przywrócić: coś o tym samym adresie, DOI lub identyfikatorze znów istnieje.',
      };
    }
    throw err;
  }
  await prisma.trashItem.delete({ where: { id: item.id } });
  await logAudit(
    user,
    'restore',
    item.entity,
    `${item.label} (z kosza)`,
    item.entityId
  );
  revalidatePublicSite();
  // The item's form disappears with it, so the page shows the confirmation
  redirect(adminHref(`/trash?restored=${item.entity}`));
}

export async function purgeTrash(formData: FormData) {
  const user = await requireUser('ADMIN');
  const item = await prisma.trashItem.findUnique({
    where: { id: field(formData, 'id', 100) },
  });
  if (!item) return;
  await purgeTrashItem(item.id);
  await logAudit(
    user,
    'purge',
    item.entity,
    `${item.label} (usunięte na zawsze)`,
    item.entityId
  );
  revalidatePath(adminHref('/trash'));
}
