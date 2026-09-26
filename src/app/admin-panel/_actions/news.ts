'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseDateInput } from '@/lib/dates';
import { sanitizeArticleHtml, stripHtml } from '@/lib/content-utils';
import { logAudit } from '@/lib/admin/audit';
import {
  checkbox,
  field,
  translations,
  type FormState,
} from '@/lib/admin/form';
import { newsSnapshot } from '@/lib/admin/news-admin';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { deleteMedia, saveImage, UploadError } from '@/lib/admin/storage';
import { moveToTrash } from '@/lib/admin/trash';
import { LANGUAGES } from '@/lib/admin/languages';

const TITLE_MAX = 300;

function refresh(newsId?: string) {
  revalidatePublicSite();
  revalidatePath(adminHref('/news'));
  if (newsId) revalidatePath(adminHref(`/news/${newsId}`));
}

export async function saveNews(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const id = field(formData, 'id', 100) || undefined;

  const texts = translations(formData, ['title', 'content'], {
    title: TITLE_MAX,
    content: 200_000,
  })
    .map(({ languageCode, values }) => ({
      languageCode,
      title: values.title,
      content: sanitizeArticleHtml(values.content),
    }))
    // The editor leaves an empty paragraph when cleared
    .filter((t) => t.title || stripHtml(t.content));

  const polish = texts.find((t) => t.languageCode === 'pl');
  if (!polish?.title || !stripHtml(polish.content)) {
    return { error: 'Tytuł i treść po polsku są wymagane.' };
  }
  const incomplete = texts.find((t) => !t.title || !stripHtml(t.content));
  if (incomplete) {
    const name = LANGUAGES.find(
      (l) => l.code === incomplete.languageCode
    )!.label;
    return {
      error: `Wersja: ${name} ma tylko tytuł albo tylko treść. Uzupełnij obie albo usuń obie.`,
    };
  }

  const published = checkbox(formData, 'published');
  const dateInput = field(formData, 'publishedAt', 10);
  const publishedAt = dateInput ? parseDateInput(dateInput) : undefined;
  if (dateInput && !publishedAt)
    return { error: 'Nieprawidłowa data publikacji.' };

  const tagIds = formData.getAll('tags').map(String).slice(0, 50);
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true },
  });

  const translationCreates = texts.map(({ languageCode, title, content }) => ({
    languageCode,
    title,
    content,
  }));

  let newsId = id;
  if (id) {
    const before = await prisma.news.findUnique({
      where: { id },
      select: { published: true, publishedAt: true },
    });
    if (!before) return { error: 'Ten artykuł już nie istnieje.' };
    await prisma.$transaction([
      prisma.newsTranslation.deleteMany({ where: { newsId: id } }),
      prisma.news.update({
        where: { id },
        data: {
          published,
          // Publishing a draft without a chosen date dates it today
          publishedAt:
            publishedAt ??
            (published && !before.published ? new Date() : before.publishedAt),
          tags: { set: tags },
          translations: { create: translationCreates },
        },
      }),
    ]);
    const action =
      published !== before.published
        ? published
          ? 'publish'
          : 'unpublish'
        : 'update';
    await logAudit(user, action, 'news', `Aktualność „${polish.title}”`, id);
  } else {
    const created = await prisma.news.create({
      data: {
        published,
        publishedAt: publishedAt ?? new Date(),
        tags: { connect: tags },
        translations: { create: translationCreates },
      },
    });
    newsId = created.id;
    await logAudit(
      user,
      published ? 'publish' : 'create',
      'news',
      `Aktualność „${polish.title}”`,
      newsId
    );
  }

  refresh(newsId);
  if (!id) redirect(adminHref(`/news/${newsId}?created=1`));
  return {
    message: published
      ? 'Zapisano. Artykuł jest widoczny na stronie.'
      : 'Zapisano szkic.',
  };
}

export async function deleteNews(formData: FormData) {
  const user = await requireUser();
  const id = field(formData, 'id', 100);
  await prisma.$transaction(async (tx) => {
    const snapshot = await newsSnapshot(tx, id);
    if (!snapshot) return;
    const title =
      snapshot.translations.find((t) => t.languageCode === 'pl')?.title ??
      snapshot.translations[0]?.title ??
      id;
    await moveToTrash(tx, user, {
      entity: 'news',
      entityId: id,
      label: `Aktualność „${title}”`,
      data: snapshot,
    });
    await tx.news.delete({ where: { id } });
    await logAudit(
      user,
      'delete',
      'news',
      `Aktualność „${title}” (do kosza)`,
      id
    );
  });
  refresh();
  redirect(adminHref('/news?deleted=1'));
}

// ──── Photos ─────────────────────────────────────────────────────────

export async function uploadNewsPhotos(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const newsId = field(formData, 'newsId', 100);
  const files = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0)
    return { error: 'Wybierz co najmniej jedno zdjęcie.' };
  if (files.length > 20)
    return { error: 'Naraz można dodać najwyżej 20 zdjęć.' };

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    select: { photos: { select: { displayOrder: true } } },
  });
  if (!news) return { error: 'Ten artykuł już nie istnieje.' };

  let order = Math.max(-1, ...news.photos.map((p) => p.displayOrder));
  const saved: string[] = [];
  try {
    for (const file of files) {
      const url = await saveImage(file);
      saved.push(url);
      await prisma.photo.create({
        data: { newsId, url, displayOrder: ++order },
      });
    }
  } catch (error) {
    if (error instanceof UploadError) {
      refresh(newsId);
      const done = saved.length
        ? ` Dodano ${saved.length} z ${files.length}.`
        : '';
      return { error: `${error.message}${done}` };
    }
    throw error;
  }
  await logAudit(
    user,
    'update',
    'news',
    `Dodanie ${files.length} zdjęć do aktualności`,
    newsId
  );
  refresh(newsId);
  return {
    message:
      files.length === 1 ? 'Dodano zdjęcie.' : `Dodano ${files.length} zdjęć.`,
  };
}

export async function savePhotoAlts(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const photoId = field(formData, 'photoId', 100);
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { newsId: true },
  });
  if (!photo) return { error: 'To zdjęcie już nie istnieje.' };

  const alts = translations(formData, ['alt'], { alt: 300 });
  await prisma.$transaction([
    prisma.photoTranslation.deleteMany({ where: { photoId } }),
    prisma.photoTranslation.createMany({
      data: alts.map(({ languageCode, values }) => ({
        photoId,
        languageCode,
        alt: values.alt,
      })),
    }),
  ]);
  await logAudit(
    user,
    'update',
    'news',
    'Opis zdjęcia w aktualności',
    photo.newsId
  );
  refresh(photo.newsId);
  return { message: 'Zapisano opis.' };
}

export async function movePhoto(formData: FormData) {
  const user = await requireUser();
  const photoId = field(formData, 'photoId', 100);
  const direction = field(formData, 'direction', 4) === 'up' ? -1 : 1;
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { newsId: true },
  });
  if (!photo) return;

  const photos = await prisma.photo.findMany({
    where: { newsId: photo.newsId },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const index = photos.findIndex((p) => p.id === photoId);
  const target = index + direction;
  if (target < 0 || target >= photos.length) return;
  [photos[index], photos[target]] = [photos[target], photos[index]];

  await prisma.$transaction(
    photos.map((p, i) =>
      prisma.photo.update({ where: { id: p.id }, data: { displayOrder: i } })
    )
  );
  await logAudit(
    user,
    'update',
    'news',
    'Zmiana kolejności zdjęć',
    photo.newsId
  );
  refresh(photo.newsId);
}

export async function deletePhoto(formData: FormData) {
  const user = await requireUser();
  const photoId = field(formData, 'photoId', 100);
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;
  await prisma.photo.delete({ where: { id: photoId } });
  await deleteMedia(photo.url);
  await logAudit(
    user,
    'update',
    'news',
    'Usunięcie zdjęcia z aktualności',
    photo.newsId
  );
  refresh(photo.newsId);
}
