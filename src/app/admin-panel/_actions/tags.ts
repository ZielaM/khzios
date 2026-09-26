'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, translations, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';

export async function saveTag(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const names = translations(formData, ['name'], { name: 60 });
  const polish = names.find((n) => n.languageCode === 'pl')?.values.name;
  if (!polish) return { error: 'Nazwa po polsku jest wymagana.' };

  // The Polish name is also the tag's key in search links (?tag=...)
  const clash = await prisma.tag.findFirst({
    where: { name: polish, NOT: id ? { id } : undefined },
  });
  if (clash) return { error: `Tag „${polish}” już istnieje.` };

  const data = names.map(({ languageCode, values }) => ({
    languageCode,
    name: values.name,
  }));
  if (id) {
    await prisma.$transaction([
      prisma.tagTranslation.deleteMany({ where: { tagId: id } }),
      prisma.tag.update({
        where: { id },
        data: { name: polish, translations: { create: data } },
      }),
    ]);
    await logAudit(user, 'update', 'tag', `Tag „${polish}”`, id);
  } else {
    const tag = await prisma.tag.create({
      data: { name: polish, translations: { create: data } },
    });
    await logAudit(user, 'create', 'tag', `Tag „${polish}”`, tag.id);
  }
  revalidatePublicSite();
  revalidatePath(adminHref('/tags'));
  return { message: id ? 'Zapisano.' : `Dodano tag „${polish}”.` };
}

/** Removes a tag from every article; tags are not kept in the trash. */
export async function deleteTag(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) return;
  await prisma.tag.delete({ where: { id } });
  await logAudit(user, 'delete', 'tag', `Tag „${tag.name}”`, id);
  revalidatePublicSite();
  revalidatePath(adminHref('/tags'));
}
