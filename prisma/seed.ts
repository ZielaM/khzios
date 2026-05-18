import { prisma } from '@/lib/prisma';

// Helper to get random elements
const getRandomMultiple = <T>(arr: T[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function main() {
  console.log('Rozpoczynam populację bazy danych KHZIOS...');

  console.log('Czyszczenie istniejących danych...');
  await prisma.newsTranslation.deleteMany();
  await prisma.tagTranslation.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.news.deleteMany();
  await prisma.tag.deleteMany();

  console.log('Tworzenie tagów...');
  const tagsData = [
    {
      pl: 'Hodowla Trzody',
      en: 'Swine Breeding',
      uk: 'Розведення свиней',
      ru: 'Разведение свиней',
    },
    {
      pl: 'Ocena Surowców',
      en: 'Product Evaluation',
      uk: 'Оцінка сировини',
      ru: 'Оценка сырья',
    },
    {
      pl: 'Drób',
      en: 'Poultry',
      uk: 'Птиця',
      ru: 'Птица',
    },
    {
      pl: 'Zwierzęta Futerkowe',
      en: 'Fur Animals',
      uk: 'Хутрові звірі',
      ru: 'Пушные звери',
    },
    {
      pl: 'Wydarzenia',
      en: 'Events',
      uk: 'Події',
      ru: 'События',
    },
    {
      pl: 'Publikacje',
      en: 'Publications',
      uk: 'Публікації',
      ru: 'Публикации',
    },
    {
      pl: 'Badania',
      en: 'Research',
      uk: 'Дослідження',
      ru: 'Исследования',
    },
  ];

  const createdTags = await Promise.all(
    tagsData.map((t) =>
      prisma.tag.create({
        data: {
          name: t.en, // Internal unique name
          translations: {
            create: [
              { languageCode: 'pl', name: t.pl },
              { languageCode: 'en', name: t.en },
              { languageCode: 'uk', name: t.uk },
              { languageCode: 'ru', name: t.ru },
            ],
          },
        },
      })
    )
  );

  console.log('Generowanie 100 zaawansowanych artykułów...');

  // Fragments to build titles
  const titlePrefixes = {
    pl: [
      'Nowe badania:',
      'Raport:',
      'Sukces Katedry:',
      'Wydarzenie:',
      'Odkrycie:',
    ],
    en: [
      'New Research:',
      'Report:',
      'Department Success:',
      'Event:',
      'Discovery:',
    ],
    uk: [
      'Нові дослідження:',
      'Звіт:',
      'Успіх кафедри:',
      'Подія:',
      'Відкриття:',
    ],
    ru: [
      'Новые исследования:',
      'Отчет:',
      'Успех кафедры:',
      'Событие:',
      'Открытие:',
    ],
  };

  const titleSubjects = {
    pl: [
      'Ocena jakości mięsa wieprzowego',
      'Genetyka drobiu ozdobnego',
      'Hodowla rasy Złotnickiej',
      'Wpływ żywienia na jakość mleka',
      'Ochrona zdrowia zwierząt futerkowych',
      'Nowoczesne metody oceny surowców',
    ],
    en: [
      'Pork meat quality evaluation',
      'Genetics of ornamental poultry',
      'Zlotnicka breed breeding',
      'Impact of feeding on milk quality',
      'Health protection of fur animals',
      'Modern methods of raw material evaluation',
    ],
    uk: [
      'Оцінка якості свинини',
      'Генетика декоративної птиці',
      'Розведення породи Злотницька',
      'Вплив годівлі на якість молока',
      "Охорона здоров'я хутрових звірів",
      'Сучасні методи оцінки сировини',
    ],
    ru: [
      'Оценка качества свинины',
      'Генетика декоративной птицы',
      'Разведение породы Злотницкая',
      'Влияние кормления на качество молока',
      'Охрана здоровья пушных зверей',
      'Современные методы оценки сырья',
    ],
  };

  // Fragments to build rich HTML content
  const htmlTemplates = [
    (topic: string) => `
      <p>W dzisiejszym artykule omawiamy zagadnienie: <strong>${topic}</strong>. Badania prowadzone przez naszą Katedrę przynoszą obiecujące rezultaty, które mogą zrewolucjonizować branżę.</p>
      <h2>Główne założenia</h2>
      <p>Przeanalizowaliśmy ponad 500 próbek w naszym najnowocześniejszym laboratorium weterynaryjnym.</p>
      <ul>
        <li>Zwiększona odporność stad</li>
        <li>Optymalizacja procesów oceny surowców</li>
        <li>Wdrażanie standardów dobrostanu zwierząt</li>
      </ul>
      <blockquote>"To przełom w naszej dziedzinie. Dzięki wsparciu Uniwersytetu Przyrodniczego w Poznaniu osiągnęliśmy więcej, niż zakładaliśmy." - prof. dr hab. Jan Kowalski</blockquote>
      <p>Zapraszamy do zapoznania się z pełną publikacją w naszym repozytorium.</p>
    `,
    (topic: string) => `
      <style>
        .highlight-box { background: rgba(36, 113, 81, 0.1); border-left: 4px solid #247151; padding: 16px; margin: 20px 0; border-radius: 4px; }
      </style>
      <p>Katedra Hodowli Zwierząt i Oceny Surowców ma zaszczyt przedstawić najnowsze wytyczne dotyczące <em>${topic}</em>.</p>
      <div class="highlight-box">
        <strong>Ważne:</strong> Nowe protokoły obowiązują od początku nadchodzącego semestru dla wszystkich studentów i pracowników.
      </div>
      <h3>Szczegóły techniczne</h3>
      <p>Wykorzystując nowoczesne metody analityczne, udało nam się wyizolować kluczowe czynniki wpływające na jakość końcowego surowca pochodzenia zwierzęcego.</p>
      <ol>
        <li>Pobór próbek w środowisku sterylnym</li>
        <li>Analiza spektrometryczna</li>
        <li>Korelacja z danymi genetycznymi stada matczynego</li>
      </ol>
      <p>Dalsze kroki obejmują publikację wyników w czasopismach z listy filadelfijskiej.</p>
    `,
    (topic: string) => `
      <p>Nasze zespoły badawcze nie zwalniają tempa. Skupiając się na <strong>${topic}</strong>, wyznaczamy nowe standardy edukacyjne i naukowe.</p>
      <h2>Konferencja Międzynarodowa</h2>
      <p>Już wkrótce zaprezentujemy nasze osiągnięcia na arenie międzynarodowej. Studenci zaangażowani w projekt otrzymają możliwość uczestnictwa w wyjazdach zagranicznych.</p>
      <blockquote>Ciągły rozwój to podstawa hodowli na miarę XXI wieku. Nasi specjaliści dbają o to każdego dnia.</blockquote>
      <p>Poniżej przedstawiamy wstępny harmonogram prac na najbliższy kwartał. Zachęcamy do śledzenia aktualizacji na naszej stronie głównej KHZIOS.</p>
    `,
  ];

  // Helper to construct English/UK/RU generic equivalents since LLM can't translate 100 perfectly on the fly,
  // we will map the Polish template structure dynamically.
  const contentGenerators = {
    pl: (topic: string, idx: number) =>
      htmlTemplates[idx % htmlTemplates.length](topic),
    en: (topic: string, idx: number) => {
      if (idx % htmlTemplates.length === 0)
        return `<p>In today's article, we discuss: <strong>${topic}</strong>. The research conducted by our Department brings promising results.</p><h2>Main objectives</h2><ul><li>Increased herd immunity</li><li>Optimization of raw material evaluation</li><li>Implementation of animal welfare standards</li></ul><blockquote>"This is a breakthrough in our field." - Prof. Jan Kowalski</blockquote>`;
      if (idx % htmlTemplates.length === 1)
        return `<style>.highlight-box { background: rgba(36, 113, 81, 0.1); border-left: 4px solid #247151; padding: 16px; margin: 20px 0; border-radius: 4px; }</style><p>The Department of Animal Breeding and Product Evaluation presents guidelines on <em>${topic}</em>.</p><div class="highlight-box"><strong>Important:</strong> New protocols apply from next semester.</div><h3>Technical details</h3><ol><li>Sterile sampling</li><li>Spectrometric analysis</li><li>Correlation with genetic data</li></ol>`;
      return `<p>Our research teams are not slowing down. Focusing on <strong>${topic}</strong>, we set new educational and scientific standards.</p><h2>International Conference</h2><p>We will soon present our achievements internationally.</p><blockquote>Continuous development is the basis of 21st-century breeding.</blockquote>`;
    },
    uk: (topic: string, idx: number) => {
      if (idx % htmlTemplates.length === 0)
        return `<p>Сьогодні ми обговорюємо: <strong>${topic}</strong>. Дослідження, проведені нашою кафедрою, дають багатообіцяючі результати.</p><h2>Основні цілі</h2><ul><li>Підвищення імунітету стада</li><li>Оптимізація оцінки сировини</li><li>Впровадження стандартів добробуту тварин</li></ul><blockquote>"Це прорив у нашій галузі." - проф. Ян Ковальський</blockquote>`;
      if (idx % htmlTemplates.length === 1)
        return `<style>.highlight-box { background: rgba(36, 113, 81, 0.1); border-left: 4px solid #247151; padding: 16px; margin: 20px 0; border-radius: 4px; }</style><p>Кафедра представляє рекомендації щодо <em>${topic}</em>.</p><div class="highlight-box"><strong>Важливо:</strong> Нові протоколи діють з наступного семестру.</div><h3>Технічні деталі</h3><ol><li>Стерильний відбір проб</li><li>Спектрометричний аналіз</li><li>Кореляція з генетичними даними</li></ol>`;
      return `<p>Наші дослідницькі групи не збавляють темпів. Зосереджуючись на <strong>${topic}</strong>, ми встановлюємо нові стандарти.</p><h2>Міжнародна конференція</h2><p>Незабаром ми представимо наші досягнення на міжнародному рівні.</p><blockquote>Постійний розвиток - основа селекції 21 століття.</blockquote>`;
    },
    ru: (topic: string, idx: number) => {
      if (idx % htmlTemplates.length === 0)
        return `<p>Сегодня мы обсуждаем: <strong>${topic}</strong>. Исследования, проведенные нашей кафедрой, приносят многообещающие результаты.</p><h2>Основные цели</h2><ul><li>Повышение иммунитета стада</li><li>Оптимизация оценки сырья</li><li>Внедрение стандартов благополучия животных</li></ul><blockquote>"Это прорыв в нашей области." - проф. Ян Ковальский</blockquote>`;
      if (idx % htmlTemplates.length === 1)
        return `<style>.highlight-box { background: rgba(36, 113, 81, 0.1); border-left: 4px solid #247151; padding: 16px; margin: 20px 0; border-radius: 4px; }</style><p>Кафедра представляет рекомендации по <em>${topic}</em>.</p><div class="highlight-box"><strong>Важно:</strong> Новые протоколы действуют со следующего семестра.</div><h3>Технические детали</h3><ol><li>Стерильный отбор проб</li><li>Спектрометрический анализ</li><li>Корреляция с генетическими данными</li></ol>`;
      return `<p>Наши исследовательские группы не сбавляют темп. Ориентируясь на <strong>${topic}</strong>, мы устанавливаем новые стандарты.</p><h2>Международная конференция</h2><p>Вскоре мы представим наши достижения на международном уровне.</p><blockquote>Постоянное развитие - основа селекции 21 века.</blockquote>`;
    },
  };

  const images = [
    '/image1.png',
    '/image2.png',
    '/image3.png',
    '/image4.png',
    '/image5.png',
  ];

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < 100; i++) {
        // Select random title components
        const prefixIdx = i % titlePrefixes.pl.length;
        const subjectIdx = i % titleSubjects.pl.length;

        const titlePl = `${titlePrefixes.pl[prefixIdx]} ${titleSubjects.pl[subjectIdx]} (#${i + 1})`;
        const titleEn = `${titlePrefixes.en[prefixIdx]} ${titleSubjects.en[subjectIdx]} (#${i + 1})`;
        const titleUk = `${titlePrefixes.uk[prefixIdx]} ${titleSubjects.uk[subjectIdx]} (#${i + 1})`;
        const titleRu = `${titlePrefixes.ru[prefixIdx]} ${titleSubjects.ru[subjectIdx]} (#${i + 1})`;

        const contentPl = contentGenerators.pl(titleSubjects.pl[subjectIdx], i);
        const contentEn = contentGenerators.en(titleSubjects.en[subjectIdx], i);
        const contentUk = contentGenerators.uk(titleSubjects.uk[subjectIdx], i);
        const contentRu = contentGenerators.ru(titleSubjects.ru[subjectIdx], i);

        const isPublished = i % 10 !== 0; // 90% published
        const randomTags = getRandomMultiple(createdTags, (i % 3) + 1); // 1 to 3 tags

        // Photos
        const photoCount = i % 6; // 0 to 5 photos per gallery
        const photos = Array.from({ length: photoCount }).map((_, pIdx) => ({
          url: images[pIdx % images.length],
        }));

        // Date spread over the last year
        const date = new Date();
        date.setDate(date.getDate() - i * 3); // every 3 days

        await tx.news.create({
          data: {
            published: isPublished,
            createdAt: date,
            tags: {
              connect: randomTags.map((t) => ({ id: t.id })),
            },
            photos: { create: photos },
            translations: {
              create: [
                { languageCode: 'pl', title: titlePl, content: contentPl },
                { languageCode: 'en', title: titleEn, content: contentEn },
                { languageCode: 'uk', title: titleUk, content: contentUk },
                { languageCode: 'ru', title: titleRu, content: contentRu },
              ],
            },
          },
        });
      }
    },
    {
      timeout: 150000, // Extend timeout for 100 articles
    }
  );

  console.log('Populacja bazy zakończona sukcesem!');
  console.log('Utworzono 100 unikalnych, bogatych w HTML artykułów.');
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
