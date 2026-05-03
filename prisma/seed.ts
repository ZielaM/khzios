import { prisma } from '../src/lib/prisma';
// Opcjonalnie możesz zaimportować Enum z wygenerowanego klienta, jeśli wolisz ścisłe typowanie:
// import { LanguageCode } from '@prisma/client';

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
          {
            languageCode: 'uk',
            title: "Нова комп'ютерна лабораторія",
            content:
              "Ми раді повідомити про відкриття нової, сучасно обладнаної комп'ютерної лабораторії. Вона налічує 30 робочих місць з найновішим програмним забезпеченням.",
          },
          {
            languageCode: 'ru',
            title: 'Новая компьютерная лаборатория',
            content:
              'Мы рады сообщить об открытии новой, современно оборудованной компьютерной лаборатории. Она насчитывает 30 рабочих мест с новейшим программным обеспечением.',
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
          {
            languageCode: 'uk',
            title: 'Результати шкільного Хакатону 2026',
            content:
              'Ми вже знаємо переможців цьогорічного Хакатону! Перше місце посіла команда "CodeNinjas", яка створила інноваційний додаток.',
          },
          {
            languageCode: 'ru',
            title: 'Результаты школьного Хакатона 2026',
            content:
              'Мы уже знаем победителей Хакатона в этом году! Первое место заняла команда "CodeNinjas", создавшая инновационное приложение.',
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
          {
            languageCode: 'uk',
            title: 'Реєстрація на гурток з алгоритміки',
            content:
              'Розпочалась реєстрація на додаткові заняття з алгоритміки. Запрошуємо всіх бажаючих.',
          },
          {
            languageCode: 'ru',
            title: 'Регистрация на кружок по алгоритмике',
            content:
              'Началась регистрация на дополнительные занятия по алгоритмике. Приглашаем всех желающих.',
          },
        ],
      },
    },
    include: { translations: true },
  });

  // Zaktualizowano również sprawdzenie języka w funkcji pomocniczej
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
