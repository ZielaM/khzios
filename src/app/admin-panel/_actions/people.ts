'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, translations, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { employeeSnapshot } from '@/lib/admin/people-admin';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { slugify } from '@/lib/admin/slug';
import { saveImage, UploadError } from '@/lib/admin/storage';
import { deleteMediaIfUnused, moveToTrash } from '@/lib/admin/trash';

const ORCID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function refresh(id?: string) {
  revalidatePublicSite();
  revalidatePath(adminHref('/employees'));
  if (id) revalidatePath(adminHref(`/employees/${id}`));
}

export async function saveEmployee(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;
  const firstName = field(formData, 'firstName', 100);
  const lastName = field(formData, 'lastName', 100);
  const email = field(formData, 'email', 200) || null;
  const phone = field(formData, 'phone', 50) || null;
  const officeLocation = field(formData, 'officeLocation', 200) || null;
  const orcid = field(formData, 'orcid', 19).toUpperCase() || null;
  let profileSlug = slugify(field(formData, 'profileSlug', 100));

  if (!firstName || !lastName) return { error: 'Imię i nazwisko są wymagane.' };
  if (email && !EMAIL.test(email))
    return { error: 'Nieprawidłowy adres e-mail.' };
  if (orcid && !ORCID.test(orcid))
    return {
      error: 'ORCID ma postać 0000-0000-0000-0000 (ostatni znak może być X).',
    };

  profileSlug ||= slugify(`${firstName} ${lastName}`) || 'pracownik';
  const slugTaken = await prisma.employee.findFirst({
    where: { profileSlug, NOT: id ? { id } : undefined },
  });
  if (slugTaken)
    return {
      error: `Adres profilu „${profileSlug}” jest już zajęty. Wpisz inny.`,
    };
  if (orcid) {
    const orcidTaken = await prisma.employee.findFirst({
      where: { orcid, NOT: id ? { id } : undefined },
    });
    if (orcidTaken)
      return { error: 'Ten ORCID jest już przypisany innej osobie.' };
  }

  let photoUrl: string | undefined;
  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveImage(photo);
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message };
      throw error;
    }
  }
  const removePhoto = formData.get('removePhoto') === 'on';

  const titles = translations(formData, ['academicTitle'], {
    academicTitle: 100,
  }).map(({ languageCode, values }) => ({
    languageCode,
    academicTitle: values.academicTitle,
  }));
  const base = {
    firstName,
    lastName,
    email,
    phone,
    officeLocation,
    orcid,
    profileSlug,
  };
  const name = `${firstName} ${lastName}`;

  if (id) {
    const before = await prisma.employee.findUnique({
      where: { id },
      select: { photoUrl: true },
    });
    if (!before) return { error: 'Ta osoba już nie istnieje.' };
    const nextPhoto = photoUrl ?? (removePhoto ? null : before.photoUrl);
    await prisma.$transaction([
      prisma.employeeTranslation.deleteMany({ where: { employeeId: id } }),
      prisma.employee.update({
        where: { id },
        data: {
          ...base,
          photoUrl: nextPhoto,
          translations: { create: titles },
        },
      }),
    ]);
    if (before.photoUrl !== nextPhoto)
      await deleteMediaIfUnused(before.photoUrl);
    await logAudit(user, 'update', 'employee', `Pracownik ${name}`, id);
    refresh(id);
    return { message: 'Zapisano.' };
  }

  const created = await prisma.employee.create({
    data: {
      ...base,
      photoUrl: photoUrl ?? null,
      translations: { create: titles },
    },
  });
  await logAudit(user, 'create', 'employee', `Pracownik ${name}`, created.id);
  refresh();
  redirect(adminHref(`/employees/${created.id}?created=1`));
}

export async function deleteEmployee(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const head = await prisma.departmentHead.findUnique({
    where: { employeeId: id },
  });
  if (head) redirect(adminHref(`/employees/${id}?blocked=head`));

  await prisma.$transaction(async (tx) => {
    const snapshot = await employeeSnapshot(tx, id);
    if (!snapshot) return;
    const name = `${snapshot.firstName} ${snapshot.lastName}`;
    await moveToTrash(tx, user, {
      entity: 'employee',
      entityId: id,
      label: `Pracownik ${name}`,
      data: snapshot,
    });
    // Memberships block the delete (onDelete: Restrict); consultations cascade
    await tx.teamMember.deleteMany({ where: { employeeId: id } });
    await tx.employee.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'employee',
      `Pracownik ${name} (do kosza)`,
      id
    );
  });
  refresh();
  redirect(adminHref('/employees?deleted=1'));
}
