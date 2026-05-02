import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Rozpoczynam populację bazy danych...');

  // Czyszczenie istniejących danych (opcjonalne, ale zapobiega duplikatom)
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
        ],
      },
    },
  });

  console.log('Tworzenie artykułów...');
  const news1 = await prisma.news.create({
    data: {
      published: true,
      tags: {
        connect: [{ id: tagTechnologia.id }, { id: tagEdukacja.id }],
      },
      photos: {
        create: [{ url: '/image.png' }, { url: '/image.png' }],
      },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Nowa pracownia komputerowa',
            content:
              'Z radością informujemy o otwarciu nowej, nowocześnie wyposażonej pracowni komputerowej. Znajduje się w niej 30 stanowisk z najnowszym oprogramowaniem, co pozwoli na jeszcze lepszą naukę programowania i projektowania.',
          },
          {
            languageCode: 'en',
            title: 'New computer lab',
            content:
              'We are pleased to announce the opening of a new, modernly equipped computer lab. It features 30 workstations with the latest software, enabling even better learning in programming and design.',
          },
        ],
      },
    },
    include: { translations: true },
  });

  const news2 = await prisma.news.create({
    data: {
      published: true,
      tags: {
        connect: [{ id: tagWydarzenia.id }, { id: tagTechnologia.id }],
      },
      photos: {
        create: [{ url: '/image.png' }],
      },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Wyniki szkolnego Hackathonu 2026',
            content:
              'Znamy już zwycięzców tegorocznego Hackathonu! Pierwsze miejsce zajęła drużyna "CodeNinjas", która stworzyła innowacyjną aplikację. Serdecznie gratulujemy wszystkim uczestnikom zaangażowania i wspaniałych pomysłów.',
          },
          {
            languageCode: 'en',
            title: 'School Hackathon 2026 Results',
            content:
              'We now know the winners of this year\'s Hackathon! First place went to team "CodeNinjas", who created an innovative application. Congratulations to all participants for their dedication and great ideas.',
          },
        ],
      },
    },
    include: { translations: true },
  });

  const news3 = await prisma.news.create({
    data: {
      published: false,
      tags: {
        connect: [{ id: tagEdukacja.id }],
      },
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Zapisy na kółko z algorytmiki',
            content:
              'Ruszyły zapisy na dodatkowe zajęcia z algorytmiki. Zapraszamy wszystkich pasjonatów, którzy chcą przygotować się do olimpiady informatycznej. Liczba miejsc jest ograniczona!',
          },
          {
            languageCode: 'en',
            title: 'Algorithmics club sign-ups',
            content:
              'Sign-ups for extra algorithmics classes have started. We invite all enthusiasts who want to prepare for the Computer Science Olympiad. Places are limited!',
          },
        ],
      },
    },
    include: { translations: true },
  });

  const getTitle = (news: typeof news1) =>
    news.translations.find((t) => t.languageCode === 'pl')?.title ?? news.id;

  console.log('Populacja bazy zakończona sukcesem!');
  console.log(`Utworzono artykuły:
  - ${getTitle(news1)}
  - ${getTitle(news2)}
  - ${getTitle(news3)}`);
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
