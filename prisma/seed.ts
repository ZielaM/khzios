import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Rozpoczynam populację bazy danych...');

  console.log('Czyszczenie istniejących danych...');
  await prisma.newsTranslation.deleteMany();
  await prisma.tagTranslation.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.news.deleteMany();
  await prisma.tag.deleteMany();

  console.log('Tworzenie tagów...');
  const tagTechnologia = await prisma.tag.create({
    data: {
      name: 'Technologia',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Technologia' },
          { languageCode: 'en', name: 'Technology' },
          { languageCode: 'uk', name: 'Технології' },
          { languageCode: 'ru', name: 'Технологии' },
        ],
      },
    },
  });
  const tagEdukacja = await prisma.tag.create({
    data: {
      name: 'Edukacja',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Edukacja' },
          { languageCode: 'en', name: 'Education' },
          { languageCode: 'uk', name: 'Освіта' },
          { languageCode: 'ru', name: 'Образование' },
        ],
      },
    },
  });
  const tagWydarzenia = await prisma.tag.create({
    data: {
      name: 'Wydarzenia',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Wydarzenia' },
          { languageCode: 'en', name: 'Events' },
          { languageCode: 'uk', name: 'Події' },
          { languageCode: 'ru', name: 'События' },
        ],
      },
    },
  });

  console.log('Tworzenie unikalnych artykułów...');
  const news1 = await prisma.news.create({
    data: {
      published: true,
      tags: { connect: [{ id: tagTechnologia.id }, { id: tagEdukacja.id }] },
      photos: { create: [{ url: '/image.png' }, { url: '/image.png' }] },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Nowa pracownia komputerowa',
            content: 'Z radością informujemy...',
          },
          {
            languageCode: 'en',
            title: 'New computer lab',
            content: 'We are pleased to announce...',
          },
          {
            languageCode: 'uk',
            title: "Нова комп'ютерна лабораторія",
            content: 'Ми раді повідомити...',
          },
          {
            languageCode: 'ru',
            title: 'Новая компьютерная лаборатория',
            content: 'Мы рады сообщить...',
          },
        ],
      },
    },
    include: { translations: true },
  });

  const news2 = await prisma.news.create({
    data: {
      published: true,
      tags: { connect: [{ id: tagWydarzenia.id }, { id: tagTechnologia.id }] },
      photos: { create: [{ url: '/image.png' }] },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Wyniki szkolnego Hackathonu 2026',
            content: 'Znamy już zwycięzców...',
          },
          {
            languageCode: 'en',
            title: 'School Hackathon 2026 Results',
            content: 'We now know the winners...',
          },
          {
            languageCode: 'uk',
            title: 'Результати шкільного Хакатону 2026',
            content: 'Ми вже знаємо...',
          },
          {
            languageCode: 'ru',
            title: 'Результаты школьного Хакатона 2026',
            content: 'Мы уже знаем...',
          },
        ],
      },
    },
    include: { translations: true },
  });

  const news3 = await prisma.news.create({
    data: {
      published: false,
      tags: { connect: [{ id: tagEdukacja.id }] },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Zapisy na kółko z algorytmiki',
            content: 'Ruszyły zapisy...',
          },
          {
            languageCode: 'en',
            title: 'Algorithmics club sign-ups',
            content: 'Sign-ups for extra...',
          },
          {
            languageCode: 'uk',
            title: 'Реєстрація на гурток з алгоритміки',
            content: 'Розпочалась реєстрація...',
          },
          {
            languageCode: 'ru',
            title: 'Регистрация на кружок по алгоритмике',
            content: 'Началась регистрация...',
          },
        ],
      },
    },
    include: { translations: true },
  });

  console.log('Masowe generowanie 50 artykułów testowych...');

  await prisma.$transaction(
    async (tx) => {
      // Używamy bezpiecznej, sekwencyjnej pętli wewnątrz ZABLOKOWANEJ transakcji
      for (let i = 0; i < 50; i++) {
        await tx.news.create({
          data: {
            published: true,
            tags: {
              connect: [{ id: tagTechnologia.id }, { id: tagEdukacja.id }],
            },
            photos: { create: [{ url: '/image.png' }, { url: '/image.png' }] },
            translations: {
              create: [
                {
                  languageCode: 'pl',
                  title: `Nowa pracownia komputerowa - Kopia ${i + 1}`,
                  content:
                    'Z radością informujemy o otwarciu nowej, nowocześnie wyposażonej pracowni komputerowej. Znajduje się w niej 30 stanowisk z najnowszym oprogramowaniem, co pozwoli na jeszcze lepszą naukę programowania i projektowania.',
                },
                {
                  languageCode: 'en',
                  title: `New computer lab - Copy ${i + 1}`,
                  content: 'We are pleased to announce...',
                },
                {
                  languageCode: 'uk',
                  title: `Нова комп'ютерна лабораторія - Копія ${i + 1}`,
                  content: 'Ми раді повідомити...',
                },
                {
                  languageCode: 'ru',
                  title: `Новая компьютерная лаборатория - Копия ${i + 1}`,
                  content: 'Мы рады сообщить...',
                },
              ],
            },
          },
        });
      }
    },
    {
      timeout: 100000, // Zapas czasu dla bazy danych
    }
  );

  const getTitle = (news: typeof news1) =>
    news.translations.find((t) => t.languageCode === 'pl')?.title ?? news.id;

  console.log('Populacja bazy zakończona sukcesem!');
  console.log(`Utworzono ręczne artykuły:
  - ${getTitle(news1)}
  - ${getTitle(news2)}
  - ${getTitle(news3)}
  Oraz wygenerowano 50 dodatkowych!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
