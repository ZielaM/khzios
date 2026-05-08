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
      name: 'Technology',
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
      name: 'Education',
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
      name: 'Events',
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

  const tagSport = await prisma.tag.create({
    data: {
      name: 'Sports',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Sport' },
          { languageCode: 'en', name: 'Sports' },
          { languageCode: 'uk', name: 'Спорт' },
          { languageCode: 'ru', name: 'Спорт' },
        ],
      },
    },
  });

  const tagSztuka = await prisma.tag.create({
    data: {
      name: 'Art',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Sztuka' },
          { languageCode: 'en', name: 'Art' },
          { languageCode: 'uk', name: 'Мистецтво' },
          { languageCode: 'ru', name: 'Искусство' },
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

  const baseTopics = [
    {
      pl: {
        title: 'Wspaniały występ naszej drużyny',
        content:
          'Nasza szkolna drużyna piłkarska zajęła pierwsze miejsce w międzyszkolnym turnieju! Gratulujemy wszystkim zawodnikom wspaniałej gry i zaangażowania.',
      },
      en: {
        title: 'Great performance by our team',
        content:
          'Our school football team took first place in the inter-school tournament! Congratulations to all players for their great game and commitment.',
      },
      uk: {
        title: 'Чудовий виступ нашої команди',
        content:
          'Наша шкільна футбольна команда посіла перше місце у міжшкільному турнірі! Вітаємо всіх гравців з чудовою грою та самовідданістю.',
      },
      ru: {
        title: 'Отличное выступление нашей команды',
        content:
          'Наша школьная футбольная команда заняла первое место в межшкольном турнире! Поздравляем всех игроков с отличной игрой и самоотдачей.',
      },
      tags: [tagSport, tagWydarzenia],
    },
    {
      pl: {
        title: 'Dzień Otwarty Szkoły',
        content:
          'Zapraszamy wszystkich kandydatów na Dzień Otwarty, który odbędzie się w najbliższą sobotę. W programie zwiedzanie szkoły, spotkania z nauczycielami oraz prezentacje kół zainteresowań.',
      },
      en: {
        title: 'School Open Day',
        content:
          'We invite all candidates to the Open Day, which will take place this Saturday. The program includes a school tour, meetings with teachers, and presentations of interest clubs.',
      },
      uk: {
        title: 'День відкритих дверей',
        content:
          'Запрошуємо всіх кандидатів на День відкритих дверей, який відбудеться цієї суботи. У програмі екскурсія школою, зустрічі з вчителями та презентації гуртків за інтересами.',
      },
      ru: {
        title: 'День открытых дверей',
        content:
          'Приглашаем всех кандидатов на День открытых дверей, который состоится в эту субботу. В программе экскурсия по школе, встречи с учителями и презентации кружков по интересам.',
      },
      tags: [tagEdukacja, tagWydarzenia],
    },
    {
      pl: {
        title: 'Wystawa prac plastycznych',
        content:
          'Na korytarzu głównym można już podziwiać prace naszych uczniów przygotowane w ramach zajęć artystycznych. Tematem przewodnim wystawy jest "Wiosna w naszym mieście".',
      },
      en: {
        title: 'Art exhibition',
        content:
          'In the main corridor, you can now admire the artwork of our students prepared during art classes. The main theme of the exhibition is "Spring in our city".',
      },
      uk: {
        title: 'Виставка художніх робіт',
        content:
          'У головному коридорі вже можна помилуватися роботами наших учнів, підготовленими на уроках мистецтва. Головна тема виставки – "Весна в нашому місті".',
      },
      ru: {
        title: 'Выставка художественных работ',
        content:
          'В главном коридоре уже можно полюбоваться работами наших учеников, подготовленными на уроках искусства. Главная тема выставки – "Весна в нашем городе".',
      },
      tags: [tagSztuka, tagWydarzenia],
    },
    {
      pl: {
        title: 'Sukces w olimpiadzie informatycznej',
        content:
          'Z dumą ogłaszamy, że dwoje naszych uczniów zakwalifikowało się do finału ogólnopolskiej olimpiady informatycznej. Trzymamy kciuki za kolejne etapy!',
      },
      en: {
        title: 'Success in the IT olympiad',
        content:
          'We are proud to announce that two of our students have qualified for the finals of the national IT olympiad. Fingers crossed for the next stages!',
      },
      uk: {
        title: 'Успіх в олімпіаді з інформатики',
        content:
          'З гордістю повідомляємо, що двоє наших учнів вийшли до фіналу загальнонаціональної олімпіади з інформатики. Тримаємо кулаки за наступні етапи!',
      },
      ru: {
        title: 'Успех в олимпиаде по информатике',
        content:
          'С гордостью сообщаем, что двое наших учеников вышли в финал всероссийской олимпиады по информатике. Держим кулаки за следующие этапы!',
      },
      tags: [tagTechnologia, tagEdukacja],
    },
    {
      pl: {
        title: 'Zbiórka charytatywna',
        content:
          'Samorząd szkolny organizuje zbiórkę karmy oraz koców dla lokalnego schroniska dla zwierząt. Prosimy o przynoszenie darów do sali 102 do końca miesiąca.',
      },
      en: {
        title: 'Charity collection',
        content:
          'The student council is organizing a collection of pet food and blankets for the local animal shelter. Please bring your donations to room 102 by the end of the month.',
      },
      uk: {
        title: 'Благодійний збір',
        content:
          'Шкільна рада організовує збір корму та ковдр для місцевого притулку для тварин. Будь ласка, приносьте пожертви в кабінет 102 до кінця місяця.',
      },
      ru: {
        title: 'Благотворительный сбор',
        content:
          'Школьный совет организует сбор корма и одеял для местного приюта для животных. Пожалуйста, приносите пожертвования в кабинет 102 до конца месяца.',
      },
      tags: [tagWydarzenia],
    },
  ];

  await prisma.$transaction(
    async (tx) => {
      // Używamy bezpiecznej, sekwencyjnej pętli wewnątrz ZABLOKOWANEJ transakcji
      for (let i = 0; i < 50; i++) {
        const topic = baseTopics[i % baseTopics.length];
        const isPublished = i % 7 !== 0; // Co 7 artykuł jest nieopublikowany
        const photoCount = (i % 3) + 1; // Od 1 do 3 zdjęć
        const photos = Array.from({ length: photoCount }).map(() => ({
          url: '/image.png',
        }));

        await tx.news.create({
          data: {
            published: isPublished,
            tags: {
              connect: topic.tags.map((t) => ({ id: t.id })),
            },
            photos: { create: photos },
            translations: {
              create: [
                {
                  languageCode: 'pl',
                  title: `${topic.pl.title} #${i + 1}`,
                  content: topic.pl.content,
                },
                {
                  languageCode: 'en',
                  title: `${topic.en.title} #${i + 1}`,
                  content: topic.en.content,
                },
                {
                  languageCode: 'uk',
                  title: `${topic.uk.title} #${i + 1}`,
                  content: topic.uk.content,
                },
                {
                  languageCode: 'ru',
                  title: `${topic.ru.title} #${i + 1}`,
                  content: topic.ru.content,
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
