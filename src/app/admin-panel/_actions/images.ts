'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, translations, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { saveImage, UploadError } from '@/lib/admin/storage';
import { deleteMediaIfUnused } from '@/lib/admin/trash';

const SECTION = /^(hero|about-us|student|contact|teams\/[a-z0-9-]{1,80})$/;

function refresh() {
  revalidatePublicSite();
  revalidatePath(adminHref('/images'));
}

export async function uploadSiteImages(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const section = field(formData, 'section', 100);
  if (!SECTION.test(section)) return { error: 'Nieznana sekcja.' };
  const files = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0)
    return { error: 'Wybierz co najmniej jedno zdjęcie.' };

  const last = await prisma.siteImage.findFirst({
    where: { section },
    orderBy: { displayOrder: 'desc' },
  });
  let order = last?.displayOrder ?? -1;
  let added = 0;
  try {
    for (const file of files.slice(0, 20)) {
      const url = await saveImage(file);
      await prisma.siteImage.create({
        data: { section, url, displayOrder: ++order },
      });
      added++;
    }
  } catch (error) {
    if (!(error instanceof UploadError)) throw error;
    refresh();
    return {
      error: `${error.message}${added ? ` Dodano ${added} z ${files.length}.` : ''}`,
    };
  }
  await logAudit(
    user,
    'update',
    'images',
    `Zdjęcia sekcji ${section}: dodano ${added}`
  );
  refresh();
  return {
    message: added === 1 ? 'Dodano zdjęcie.' : `Dodano ${added} zdjęć.`,
  };
}

export async function saveSiteImageAlts(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const image = await prisma.siteImage.findUnique({ where: { id } });
  if (!image) return { error: 'To zdjęcie już nie istnieje.' };
  const alts = translations(formData, ['alt'], { alt: 300 });
  await prisma.$transaction([
    prisma.siteImageTranslation.deleteMany({ where: { siteImageId: id } }),
    prisma.siteImageTranslation.createMany({
      data: alts.map(({ languageCode, values }) => ({
        siteImageId: id,
        languageCode,
        alt: values.alt,
      })),
    }),
  ]);
  await logAudit(
    user,
    'update',
    'images',
    `Opis zdjęcia w sekcji ${image.section}`
  );
  refresh();
  return { message: 'Zapisano opis.' };
}

export async function moveSiteImage(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  const direction = field(formData, 'direction', 4) === 'up' ? -1 : 1;
  const image = await prisma.siteImage.findUnique({ where: { id } });
  if (!image) return;
  const images = await prisma.siteImage.findMany({
    where: { section: image.section },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const index = images.findIndex((i) => i.id === id);
  const target = index + direction;
  if (target < 0 || target >= images.length) return;
  [images[index], images[target]] = [images[target], images[index]];
  await prisma.$transaction(
    images.map((img, i) =>
      prisma.siteImage.update({
        where: { id: img.id },
        data: { displayOrder: i },
      })
    )
  );
  await logAudit(
    user,
    'update',
    'images',
    `Kolejność zdjęć w sekcji ${image.section}`
  );
  refresh();
}

export async function deleteSiteImage(formData: FormData) {
  const user = await requireUser();
  const image = await prisma.siteImage.findUnique({
    where: { id: field(formData, 'id', 100) },
  });
  if (!image) return;
  await prisma.siteImage.delete({ where: { id: image.id } });
  await deleteMediaIfUnused(image.url);
  await logAudit(
    user,
    'update',
    'images',
    `Usunięcie zdjęcia z sekcji ${image.section}`
  );
  refresh();
}
