'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, translations, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { weeklyHoursFrom } from '@/lib/admin/people-admin';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { saveImage, UploadError } from '@/lib/admin/storage';
import { deleteMediaIfUnused } from '@/lib/admin/trash';

function refresh() {
  revalidatePublicSite();
  revalidatePath(adminHref('/office'));
}

export async function saveHead(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const employeeId = field(formData, 'employeeId', 100);
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return { error: 'Wybierz kierownika katedry.' };

  const current = await prisma.departmentHead.findFirst();
  await prisma.$transaction(async (tx) => {
    if (current) await tx.departmentHead.delete({ where: { id: current.id } });
    await tx.departmentHead.create({
      data: { employeeId, workingHours: { create: weeklyHoursFrom(formData) } },
    });
  });
  await logAudit(
    user,
    'update',
    'office',
    `Kierownik katedry: ${employee.firstName} ${employee.lastName}`
  );
  refresh();
  return { message: 'Zapisano.' };
}

export async function saveSecretariat(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const titles = translations(formData, ['title'], { title: 200 });
  if (!titles.some((t) => t.languageCode === 'pl'))
    return { error: 'Nazwa po polsku jest wymagana.' };

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

  const current = await prisma.secretariat.findFirst();
  const nextPhoto =
    photoUrl ??
    (formData.get('removePhoto') === 'on' ? null : (current?.photoUrl ?? null));
  const data = {
    email: field(formData, 'email', 200) || null,
    phone: field(formData, 'phone', 50) || null,
    officeLocation: field(formData, 'officeLocation', 200) || null,
    photoUrl: nextPhoto,
    translations: {
      create: titles.map(({ languageCode, values }) => ({
        languageCode,
        title: values.title,
      })),
    },
    workingHours: { create: weeklyHoursFrom(formData) },
  };
  await prisma.$transaction(async (tx) => {
    // One secretariat: replaced as a whole with its titles and hours
    if (current) await tx.secretariat.delete({ where: { id: current.id } });
    await tx.secretariat.create({
      data: current ? { ...data, id: current.id } : data,
    });
  });
  if (current?.photoUrl && current.photoUrl !== nextPhoto)
    await deleteMediaIfUnused(current.photoUrl);
  await logAudit(user, 'update', 'office', 'Dane sekretariatu');
  refresh();
  return { message: 'Zapisano.' };
}
