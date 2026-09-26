import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import { LANGUAGES } from '@/lib/admin/languages';
import { IMAGE_SECTIONS } from '@/lib/site-images';
import {
  deleteSiteImage,
  moveSiteImage,
  saveSiteImageAlts,
  uploadSiteImages,
} from '../../_actions/images';
import ActionForm from '../../_components/ActionForm';
import ConfirmButton from '../../_components/ConfirmButton';
import { Field } from '../../_components/fields';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Zdjęcia stron · Panel KHZiOS' };

export default async function ImagesPage() {
  await requireUser();
  const [images, teams] = await Promise.all([
    prisma.siteImage.findMany({
      include: { translations: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.team.findMany({
      include: { translations: { where: { languageCode: 'pl' } } },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  const sections = [
    {
      key: IMAGE_SECTIONS.hero,
      label: 'Strona główna',
      hint: 'Zdjęcia zmieniają się płynnie co kilka sekund, w tej kolejności.',
      many: true,
    },
    {
      key: IMAGE_SECTIONS.aboutUs,
      label: 'O nas',
      hint: 'Zdjęcie obok nagłówka strony.',
      many: false,
    },
    {
      key: IMAGE_SECTIONS.student,
      label: 'Strefa studenta',
      hint: 'Zdjęcie obok nagłówka strony.',
      many: false,
    },
    {
      key: IMAGE_SECTIONS.contact,
      label: 'Kontakt',
      hint: 'Zdjęcie budynku obok mapy.',
      many: false,
    },
    ...teams.map((t) => ({
      key: IMAGE_SECTIONS.team(t.slug),
      label: `Zespół: ${t.translations[0]?.name ?? t.slug}`,
      hint: 'Zdjęcie na stronie zespołu i na karcie w strukturze katedry.',
      many: false,
    })),
  ];

  return (
    <div className={style.page}>
      <h1>Zdjęcia stron</h1>
      <p className={style.muted}>
        Poza stroną główną używane jest pierwsze zdjęcie sekcji. Opis zdjęcia
        (tekst alternatywny) czytają osoby niewidome i wyszukiwarki.
      </p>
      {sections.map((section) => {
        const sectionImages = images.filter((i) => i.section === section.key);
        return (
          <section
            key={section.key}
            className={style.card}
            aria-label={section.label}
          >
            <h2>{section.label}</h2>
            <p className={style.muted}>{section.hint}</p>
            {sectionImages.map((image, index) => (
              <div key={image.id} className={style.photoRow}>
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element -- panel thumbnail */}
                  <img src={image.url} alt="" />
                  {!section.many && index > 0 && (
                    <p className={style.muted}>
                      Nieużywane (liczy się pierwsze).
                    </p>
                  )}
                  <div className={style.inlineActions}>
                    {sectionImages.length > 1 && (
                      <>
                        <form action={moveSiteImage}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label={`Przesuń zdjęcie ${index + 1} wyżej`}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveSiteImage}>
                          <input type="hidden" name="id" value={image.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === sectionImages.length - 1}
                            aria-label={`Przesuń zdjęcie ${index + 1} niżej`}
                          >
                            ↓
                          </button>
                        </form>
                      </>
                    )}
                    <form action={deleteSiteImage}>
                      <input type="hidden" name="id" value={image.id} />
                      <ConfirmButton message="Usunąć to zdjęcie?">
                        Usuń
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
                <ActionForm
                  action={saveSiteImageAlts}
                  submitLabel="Zapisz opis"
                >
                  <input type="hidden" name="id" value={image.id} />
                  {LANGUAGES.map((l) => (
                    <Field
                      key={l.code}
                      label={`Opis zdjęcia (${l.label.toLowerCase()})`}
                      name={`alt_${l.code}`}
                      defaultValue={
                        image.translations.find(
                          (t) => t.languageCode === l.code
                        )?.alt ?? ''
                      }
                      maxLength={300}
                    />
                  ))}
                </ActionForm>
              </div>
            ))}
            <ActionForm action={uploadSiteImages} submitLabel="Wgraj">
              <input type="hidden" name="section" value={section.key} />
              <Field
                label={sectionImages.length ? 'Dodaj zdjęcia' : 'Wgraj zdjęcie'}
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple={section.many}
                required
                hint="JPG, PNG lub WebP do 15 MB; dane z aparatu zostaną usunięte."
              />
            </ActionForm>
          </section>
        );
      })}
    </div>
  );
}
