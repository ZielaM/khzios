import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Rozpoczynam populację bazy danych...');

  // Czyszczenie istniejących danych (opcjonalne, ale zapobiega duplikatom)
  console.log('Czyszczenie istniejących danych...');
  await prisma.photo.deleteMany();
  await prisma.news.deleteMany();
  await prisma.tag.deleteMany();

  console.log('Tworzenie tagów...');
  const tagTechnologia = await prisma.tag.create({
    data: { name: 'Technologia' },
  });
  const tagEdukacja = await prisma.tag.create({
    data: { name: 'Edukacja' },
  });
  const tagWydarzenia = await prisma.tag.create({
    data: { name: 'Wydarzenia' },
  });

  console.log('Tworzenie artykułów...');
  const news1 = await prisma.news.create({
    data: {
      title: 'Nowa pracownia komputerowa',
      content:
        'Z radością informujemy o otwarciu nowej, nowocześnie wyposażonej pracowni komputerowej. Znajduje się w niej 30 stanowisk z najnowszym oprogramowaniem, co pozwoli na jeszcze lepszą naukę programowania i projektowania.',
      published: true,
      tags: {
        connect: [{ id: tagTechnologia.id }, { id: tagEdukacja.id }],
      },
      photos: {
        create: [{ url: '/image.png' }, { url: '/image.png' }],
      },
    },
  });

  const news2 = await prisma.news.create({
    data: {
      title: 'Wyniki szkolnego Hackathonu 2026',
      content:
        'Znamy już zwycięzców tegorocznego Hackathonu! Pierwsze miejsce zajęła drużyna "CodeNinjas", która stworzyła innowacyjną aplikację. Serdecznie gratulujemy wszystkim uczestnikom zaangażowania i wspaniałych pomysłów.',
      published: true,
      tags: {
        connect: [{ id: tagWydarzenia.id }, { id: tagTechnologia.id }],
      },
      photos: {
        create: [{ url: '/image.png' }],
      },
    },
  });

  const news3 = await prisma.news.create({
    data: {
      title: 'Zapisy na kółko z algorytmiki',
      content:
        'Ruszyły zapisy na dodatkowe zajęcia z algorytmiki. Zapraszamy wszystkich pasjonatów, którzy chcą przygotować się do olimpiady informatycznej. Liczba miejsc jest ograniczona!',
      published: false,
      tags: {
        connect: [{ id: tagEdukacja.id }],
      },
    },
  });

  console.log('Populacja bazy zakończona sukcesem!');
  console.log(`Utworzono artykuły:
  - ${news1.title}
  - ${news2.title}
  - ${news3.title}`);
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
