import { prisma } from '@/lib/prisma';

export async function seedDocuments() {
  const documents = [
    {
      slug: 'cattle-breeding',
      displayOrder: 1,
      statutePath: '/documents/hodowla-bydla_statut.pdf',
      syllabusPath: '/documents/hodowla-bydla_sylabus.pdf',
      translations: {
        pl: 'Hodowla bydła',
        en: 'Cattle Breeding',
        uk: 'Розведення великої рогатої худоби',
        ru: 'Разведение крупного рогатого скота',
      },
    },
    {
      slug: 'poultry-breeding',
      displayOrder: 2,
      statutePath: '/documents/hodowla-drobiu_statut.pdf',
      syllabusPath: '/documents/hodowla-drobiu_sylabus.pdf',
      translations: {
        pl: 'Hodowla drobiu',
        en: 'Poultry Breeding',
        uk: 'Розведення птиці',
        ru: 'Разведение птицы',
      },
    },
    {
      slug: 'swine-breeding',
      displayOrder: 3,
      statutePath: '/documents/hodowla-trzody-chlewnej_statut.pdf',
      syllabusPath: '/documents/hodowla-trzody-chlewnej_sylabus.pdf',
      translations: {
        pl: 'Hodowla trzody chlewnej',
        en: 'Swine Breeding',
        uk: 'Розведення свиней',
        ru: 'Разведение свиней',
      },
    },
    {
      slug: 'product-evaluation',
      displayOrder: 4,
      statutePath: '/documents/ocena-surowcow_statut.pdf',
      syllabusPath: '/documents/ocena-surowcow_sylabus.pdf',
      translations: {
        pl: 'Ocena surowców zwierzęcych',
        en: 'Animal Product Evaluation',
        uk: 'Оцінка тваринної сировини',
        ru: 'Оценка животного сырья',
      },
    },
    {
      slug: 'genetics-and-breeding',
      displayOrder: 5,
      statutePath: '/documents/genetyka-i-metody-hodowlane_statut.pdf',
      syllabusPath: '/documents/genetyka-i-metody-hodowlane_sylabus.pdf',
      translations: {
        pl: 'Genetyka i metody hodowlane',
        en: 'Genetics and Breeding Methods',
        uk: 'Генетика та методи розведення',
        ru: 'Генетика и методы разведения',
      },
    },
  ];

  for (const doc of documents) {
    await prisma.studentDocument.create({
      data: {
        slug: doc.slug,
        displayOrder: doc.displayOrder,
        statutePath: doc.statutePath,
        syllabusPath: doc.syllabusPath,
        translations: {
          create: [
            { languageCode: 'pl', subjectName: doc.translations.pl },
            { languageCode: 'en', subjectName: doc.translations.en },
            { languageCode: 'uk', subjectName: doc.translations.uk },
            { languageCode: 'ru', subjectName: doc.translations.ru },
          ],
        },
      },
    });
  }

  console.log('Seed student documents done');
}
