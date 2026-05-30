import { prisma } from '@/lib/prisma';

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0142/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function seedTeams() {
  console.log('Tworzenie zespołów...');

  // ──── 4 FULL teams ────────────────────────────────────────────────

  const fullTeams = [
    {
      slug: 'ruminants',
      order: 0,
      names: {
        pl: 'Zespół chowu i hodowli zwierząt przeżuwających i oceny mleka',
        en: 'Ruminant Breeding and Milk Evaluation Team',
        uk: 'Група розведення жуйних тварин та оцінки молока',
        ru: 'Группа разведения жвачных животных и оценки молока',
      },
      research: {
        pl: 'Zespół prowadzi badania dotyczące optymalizacji systemów żywienia bydła mlecznego i mięsnego, oceny jakości mleka surowego oraz doskonalenia cech użytkowych ras przeżuwających. Szczególną uwagę poświęca się genomice i markerom molekularnym w selekcji, a także wpływowi czynników środowiskowych na dobrostan zwierząt.',
        en: 'The team conducts research on optimizing dairy and beef cattle feeding systems, raw milk quality evaluation, and improving production traits of ruminant breeds. Special attention is given to genomics and molecular markers in selection, as well as the influence of environmental factors on animal welfare.',
        uk: "Група проводить дослідження з оптимізації систем годівлі молочної та м'ясної худоби, оцінки якості сирого молока та вдосконалення продуктивних ознак порід жуйних тварин.",
        ru: 'Группа проводит исследования по оптимизации систем кормления молочного и мясного скота, оценке качества сырого молока и совершенствованию продуктивных признаков пород жвачных животных.',
      },
      teaching: {
        pl: 'Zespół realizuje zajęcia dydaktyczne na kierunkach Zootechnika oraz Biologia stosowana, obejmujące wykłady, ćwiczenia laboratoryjne i zajęcia terenowe z zakresu hodowli bydła i oceny mleka.',
        en: 'The team delivers teaching activities in Animal Science and Applied Biology programs, including lectures, laboratory exercises, and field classes in cattle breeding and milk evaluation.',
        uk: 'Група проводить навчальні заняття на напрямках Зоотехнія та Прикладна біологія.',
        ru: 'Группа проводит учебные занятия на направлениях Зоотехния и Прикладная биология.',
      },
      members: [
        {
          name: 'Anna Kowalska',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'anna.kowalska@up.poznan.pl',
          phone: '+48 61 848 72 01',
          orcid: '0000-0002-1825-0097',
          titles: {
            pl: 'prof. dr hab.',
            en: 'Professor',
            uk: 'проф. д-р габ.',
            ru: 'проф. д-р габ.',
          },
        },
        {
          name: 'Tomasz Nowak',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'tomasz.nowak@up.poznan.pl',
          phone: '+48 61 848 72 02',
          orcid: '0000-0003-4567-1234',
          titles: {
            pl: 'dr hab.',
            en: 'dr hab.',
            uk: 'д-р габ.',
            ru: 'д-р габ.',
          },
        },
        {
          name: 'Marta Wiśniewska',
          cat: 'ACADEMIC' as const,
          photo: null,
          email: 'marta.wisniewska@up.poznan.pl',
          phone: '+48 61 848 72 03',
          orcid: '0000-0001-9876-5432',
          titles: { pl: 'dr', en: 'PhD', uk: 'к.н.', ru: 'к.н.' },
        },
        {
          name: 'Paweł Zieliński',
          cat: 'TECHNICAL' as const,
          photo: null,
          email: 'pawel.zielinski@up.poznan.pl',
          phone: '+48 61 848 72 04',
          orcid: null,
          titles: {
            pl: 'mgr inż.',
            en: 'MSc Eng.',
            uk: 'маг. інж.',
            ru: 'маг. инж.',
          },
        },
      ],
      publications: [
        {
          year: 2024,
          authors: 'Kowalska A., Nowak T., Wiśniewska M.',
          journal: 'Journal of Dairy Science',
          doi: '10.3168/jds.2024-00001',
          titles: {
            pl: 'Wpływ żywienia na profil kwasów tłuszczowych mleka krów rasy polskiej holsztyńsko-fryzyjskiej',
            en: 'Effect of nutrition on fatty acid profile of Polish Holstein-Friesian cow milk',
            uk: 'Вплив годівлі на профіль жирних кислот молока корів польської голштинсько-фризької породи',
            ru: 'Влияние кормления на профиль жирных кислот молока коров польской голштинско-фризской породы',
          },
        },
        {
          year: 2023,
          authors: 'Nowak T., Kowalska A.',
          journal: 'Animal Feed Science and Technology',
          doi: '10.1016/j.anifeedsci.2023.001',
          titles: {
            pl: 'Optymalizacja dawek pokarmowych dla bydła mięsnego w warunkach polskich',
            en: 'Optimization of feed rations for beef cattle under Polish conditions',
            uk: "Оптимізація кормових раціонів для м'ясної худоби в польських умовах",
            ru: 'Оптимизация кормовых рационов для мясного скота в польских условиях',
          },
        },
      ],
      projects: [
        {
          years: '2023–2026',
          titles: {
            pl: 'Genomiczna selekcja bydła mlecznego w Polsce',
            en: 'Genomic selection of dairy cattle in Poland',
            uk: 'Геномна селекція молочної худоби в Польщі',
            ru: 'Геномная селекция молочного скота в Польше',
          },
          funders: {
            pl: 'NCN OPUS',
            en: 'NCN OPUS',
            uk: 'NCN OPUS',
            ru: 'NCN OPUS',
          },
        },
      ],
      courses: [
        {
          names: {
            pl: 'Hodowla bydła',
            en: 'Cattle Breeding',
            uk: 'Розведення великої рогатої худоби',
            ru: 'Разведение крупного рогатого скота',
          },
          programs: {
            pl: 'Zootechnika, I°',
            en: 'Animal Science, BSc',
            uk: 'Зоотехнія, бакалавр',
            ru: 'Зоотехния, бакалавр',
          },
          coordinators: {
            pl: 'prof. dr hab. Anna Kowalska',
            en: 'Prof. Anna Kowalska',
            uk: 'проф. Анна Ковальська',
            ru: 'проф. Анна Ковальска',
          },
        },
        {
          names: {
            pl: 'Ocena jakości mleka',
            en: 'Milk Quality Evaluation',
            uk: 'Оцінка якості молока',
            ru: 'Оценка качества молока',
          },
          programs: {
            pl: 'Zootechnika, II°',
            en: 'Animal Science, MSc',
            uk: 'Зоотехнія, магістр',
            ru: 'Зоотехния, магистр',
          },
          coordinators: {
            pl: 'dr hab. Tomasz Nowak',
            en: 'dr hab. Tomasz Nowak',
            uk: 'д-р Томаш Новак',
            ru: 'д-р Томаш Новак',
          },
        },
      ],
    },
    {
      slug: 'poultry',
      order: 1,
      names: {
        pl: 'Zespół chowu i hodowli drobiu i ptaków ozdobnych',
        en: 'Poultry and Ornamental Bird Breeding Team',
        uk: 'Група розведення птиці та декоративних птахів',
        ru: 'Группа разведения птицы и декоративных птиц',
      },
      research: {
        pl: 'Zespół specjalizuje się w badaniach nad genetyką drobiu, doskonaleniem cech produkcyjnych kur nieśnych i mięsnych oraz zachowaniem bioróżnorodności ras rodzimych ptaków ozdobnych. Prowadzone są także prace nad wpływem warunków utrzymania na jakość jaj i mięsa drobiowego.',
        en: 'The team specializes in poultry genetics, improving production traits of laying and broiler hens, and conserving biodiversity of native ornamental bird breeds.',
        uk: 'Група спеціалізується на генетиці птиці, вдосконаленні продуктивних ознак курей-несучок та бройлерів.',
        ru: 'Группа специализируется на генетике птицы, совершенствовании продуктивных признаков кур-несушек и бройлеров.',
      },
      teaching: {
        pl: 'Zespół prowadzi zajęcia z zakresu chowu i hodowli drobiu na kierunkach Zootechnika oraz Bioinżynieria zwierząt.',
        en: 'The team conducts classes in poultry breeding and husbandry within Animal Science and Animal Bioengineering programs.',
        uk: 'Група проводить заняття з птахівництва на напрямках Зоотехнія та Біоінженерія тварин.',
        ru: 'Группа проводит занятия по птицеводству на направлениях Зоотехния и Биоинженерия животных.',
      },
      members: [
        {
          name: 'Krzysztof Dąbrowski',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'krzysztof.dabrowski@up.poznan.pl',
          phone: '+48 61 848 73 01',
          orcid: '0000-0002-3456-7890',
          titles: {
            pl: 'prof. dr hab.',
            en: 'Professor',
            uk: 'проф.',
            ru: 'проф.',
          },
        },
        {
          name: 'Ewa Kamińska',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'ewa.kaminska@up.poznan.pl',
          phone: '+48 61 848 73 02',
          orcid: '0000-0001-2345-6789',
          titles: { pl: 'dr', en: 'PhD', uk: 'к.н.', ru: 'к.н.' },
        },
        {
          name: 'Jan Lewandowski',
          cat: 'TECHNICAL' as const,
          photo: null,
          email: 'jan.lewandowski@up.poznan.pl',
          phone: '+48 61 848 73 03',
          orcid: null,
          titles: {
            pl: 'mgr inż.',
            en: 'MSc Eng.',
            uk: 'маг. інж.',
            ru: 'маг. инж.',
          },
        },
      ],
      publications: [
        {
          year: 2024,
          authors: 'Dąbrowski K., Kamińska E.',
          journal: 'Poultry Science',
          doi: '10.3382/ps/pey001',
          titles: {
            pl: 'Polimorfizm genów związanych z nieśnością u kur zielononóżek',
            en: 'Gene polymorphism related to egg production in Greenleg Partridge hens',
            uk: 'Поліморфізм генів несучості у курей зеленоніжок',
            ru: 'Полиморфизм генов яйценоскости у кур зеленоножек',
          },
        },
      ],
      projects: [
        {
          years: '2022–2025',
          titles: {
            pl: 'Ochrona zasobów genetycznych rodzimych ras drobiu',
            en: 'Conservation of genetic resources of native poultry breeds',
            uk: 'Збереження генетичних ресурсів місцевих порід птиці',
            ru: 'Сохранение генетических ресурсов местных пород птицы',
          },
          funders: { pl: 'MRiRW', en: 'MRiRW', uk: 'MRiRW', ru: 'MRiRW' },
        },
      ],
      courses: [
        {
          names: {
            pl: 'Chów i hodowla drobiu',
            en: 'Poultry Breeding and Husbandry',
            uk: 'Птахівництво',
            ru: 'Птицеводство',
          },
          programs: {
            pl: 'Zootechnika, I°',
            en: 'Animal Science, BSc',
            uk: 'Зоотехнія, бакалавр',
            ru: 'Зоотехния, бакалавр',
          },
          coordinators: {
            pl: 'prof. dr hab. Krzysztof Dąbrowski',
            en: 'Prof. Krzysztof Dąbrowski',
            uk: 'проф. Кшиштоф Домбровський',
            ru: 'проф. Кшиштоф Домбровский',
          },
        },
      ],
    },
    {
      slug: 'swine',
      order: 2,
      names: {
        pl: 'Zespół chowu i hodowli trzody chlewnej',
        en: 'Swine Breeding Team',
        uk: 'Група розведення свиней',
        ru: 'Группа разведения свиней',
      },
      research: {
        pl: 'Zespół prowadzi badania z zakresu doskonalenia genetycznego świń, oceny wartości tucznej i rzeźnej oraz wpływu żywienia na jakość mięsa wieprzowego. Istotnym kierunkiem jest też ochrona zasobów genetycznych ras rodzimych.',
        en: 'The team conducts research on genetic improvement of swine, evaluation of fattening and slaughter value, and the impact of nutrition on pork meat quality.',
        uk: 'Група проводить дослідження з генетичного вдосконалення свиней, оцінки відгодівельної та забійної цінності.',
        ru: 'Группа проводит исследования по генетическому совершенствованию свиней, оценке откормочной и убойной ценности.',
      },
      teaching: {
        pl: 'Zespół realizuje program dydaktyczny obejmujący hodowlę trzody chlewnej, ocenę surowców mięsnych oraz technologię produkcji wieprzowiny.',
        en: 'The team delivers teaching covering swine breeding, meat raw material evaluation, and pork production technology.',
        uk: "Група реалізує навчальну програму з свинарства, оцінки м'ясної сировини та технології виробництва свинини.",
        ru: 'Группа реализует учебную программу по свиноводству, оценке мясного сырья и технологии производства свинины.',
      },
      members: [
        {
          name: 'Zbigniew Wójcik',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'zbigniew.wojcik@up.poznan.pl',
          phone: '+48 61 848 74 01',
          orcid: '0000-0003-8765-4321',
          titles: {
            pl: 'dr hab.',
            en: 'dr hab.',
            uk: 'д-р габ.',
            ru: 'д-р габ.',
          },
        },
        {
          name: 'Katarzyna Szymańska',
          cat: 'ACADEMIC' as const,
          photo: null,
          email: 'katarzyna.szymanska@up.poznan.pl',
          phone: '+48 61 848 74 02',
          orcid: '0000-0002-6543-2109',
          titles: { pl: 'dr', en: 'PhD', uk: 'к.н.', ru: 'к.н.' },
        },
        {
          name: 'Michał Grabowski',
          cat: 'TECHNICAL' as const,
          photo: '/placeholder-image.png',
          email: 'michal.grabowski@up.poznan.pl',
          phone: '+48 61 848 74 03',
          orcid: null,
          titles: {
            pl: 'mgr inż.',
            en: 'MSc Eng.',
            uk: 'маг. інж.',
            ru: 'маг. инж.',
          },
        },
      ],
      publications: [
        {
          year: 2023,
          authors: 'Wójcik Z., Szymańska K.',
          journal: 'Meat Science',
          doi: '10.1016/j.meatsci.2023.001',
          titles: {
            pl: 'Analiza jakości mięsa świń rasy puławskiej',
            en: 'Meat quality analysis of Puławska breed pigs',
            uk: "Аналіз якості м'яса свиней пулавської породи",
            ru: 'Анализ качества мяса свиней пулавской породы',
          },
        },
      ],
      projects: [
        {
          years: '2024–2027',
          titles: {
            pl: 'Innowacyjne metody oceny wartości rzeźnej świń',
            en: 'Innovative methods for evaluating swine slaughter value',
            uk: 'Інноваційні методи оцінки забійної цінності свиней',
            ru: 'Инновационные методы оценки убойной ценности свиней',
          },
          funders: { pl: 'NCBiR', en: 'NCBiR', uk: 'NCBiR', ru: 'NCBiR' },
        },
      ],
      courses: [
        {
          names: {
            pl: 'Hodowla trzody chlewnej',
            en: 'Swine Breeding',
            uk: 'Свинарство',
            ru: 'Свиноводство',
          },
          programs: {
            pl: 'Zootechnika, I°',
            en: 'Animal Science, BSc',
            uk: 'Зоотехнія, бакалавр',
            ru: 'Зоотехния, бакалавр',
          },
          coordinators: {
            pl: 'dr hab. Zbigniew Wójcik',
            en: 'dr hab. Zbigniew Wójcik',
            uk: 'д-р Збіґнєв Вуйцік',
            ru: 'д-р Збигнев Вуйцик',
          },
        },
        {
          names: {
            pl: 'Ocena surowców mięsnych',
            en: 'Meat Raw Material Evaluation',
            uk: "Оцінка м'ясної сировини",
            ru: 'Оценка мясного сырья',
          },
          programs: {
            pl: 'Zootechnika, II°',
            en: 'Animal Science, MSc',
            uk: 'Зоотехнія, магістр',
            ru: 'Зоотехния, магистр',
          },
          coordinators: {
            pl: 'dr Katarzyna Szymańska',
            en: 'Dr Katarzyna Szymańska',
            uk: 'д-р Катажина Шиманська',
            ru: 'д-р Катажина Шиманска',
          },
        },
      ],
    },
    {
      slug: 'fur-animals',
      order: 3,
      names: {
        pl: 'Zespół chowu i hodowli zwierząt futerkowych, jeleniowatych i oceny mięsa',
        en: 'Fur-bearing Animals, Cervids and Meat Evaluation Team',
        uk: "Група розведення хутрових звірів, оленевих та оцінки м'яса",
        ru: 'Группа разведения пушных зверей, оленевых и оценки мяса',
      },
      research: {
        pl: 'Zespół zajmuje się badaniami nad hodowlą zwierząt futerkowych i jeleniowatych, ze szczególnym uwzględnieniem dobrostanu, rozrodu oraz oceny jakości mięsa dziczyzny. Prowadzone są także analizy sensoryczne i fizykochemiczne surowców mięsnych.',
        en: 'The team focuses on breeding fur-bearing animals and cervids, with special emphasis on welfare, reproduction, and venison quality evaluation.',
        uk: "Група займається дослідженнями з розведення хутрових звірів та оленевих, з особливим акцентом на добробут та оцінку якості м'яса дичини.",
        ru: 'Группа занимается исследованиями по разведению пушных зверей и оленевых, с особым акцентом на благополучие и оценку качества мяса дичи.',
      },
      teaching: {
        pl: 'Zespół prowadzi zajęcia z hodowli zwierząt futerkowych, towaroznawstwa mięsa oraz analizy sensorycznej produktów zwierzęcych.',
        en: 'The team conducts classes on fur animal breeding, meat commodity science, and sensory analysis of animal products.',
        uk: "Група проводить заняття з хутрового звірівництва, товарознавства м'яса та сенсорного аналізу продуктів тваринництва.",
        ru: 'Группа проводит занятия по пушному звероводству, товароведению мяса и сенсорному анализу продуктов животноводства.',
      },
      members: [
        {
          name: 'Piotr Jankowski',
          cat: 'ACADEMIC' as const,
          photo: '/placeholder-image.png',
          email: 'piotr.jankowski@up.poznan.pl',
          phone: '+48 61 848 75 01',
          orcid: '0000-0001-7654-3210',
          titles: {
            pl: 'prof. dr hab.',
            en: 'Professor',
            uk: 'проф.',
            ru: 'проф.',
          },
        },
        {
          name: 'Agnieszka Kaczmarek',
          cat: 'ACADEMIC' as const,
          photo: null,
          email: 'agnieszka.kaczmarek@up.poznan.pl',
          phone: '+48 61 848 75 02',
          orcid: '0000-0003-2109-8765',
          titles: { pl: 'dr', en: 'PhD', uk: 'к.н.', ru: 'к.н.' },
        },
        {
          name: 'Robert Mazur',
          cat: 'TECHNICAL' as const,
          photo: null,
          email: 'robert.mazur@up.poznan.pl',
          phone: '+48 61 848 75 03',
          orcid: null,
          titles: {
            pl: 'mgr inż.',
            en: 'MSc Eng.',
            uk: 'маг. інж.',
            ru: 'маг. инж.',
          },
        },
      ],
      publications: [
        {
          year: 2024,
          authors: 'Jankowski P., Kaczmarek A.',
          journal: 'Meat Science',
          doi: '10.1016/j.meatsci.2024.002',
          titles: {
            pl: 'Właściwości fizykochemiczne mięsa daniela europejskiego',
            en: 'Physicochemical properties of European fallow deer meat',
            uk: "Фізико-хімічні властивості м'яса лані європейської",
            ru: 'Физико-химические свойства мяса лани европейской',
          },
        },
      ],
      projects: [
        {
          years: '2023–2026',
          titles: {
            pl: 'Dobrostan zwierząt futerkowych w warunkach fermowych',
            en: 'Welfare of fur-bearing animals in farm conditions',
            uk: 'Добробут хутрових звірів в фермерських умовах',
            ru: 'Благополучие пушных зверей в фермерских условиях',
          },
          funders: {
            pl: 'NCN SONATA',
            en: 'NCN SONATA',
            uk: 'NCN SONATA',
            ru: 'NCN SONATA',
          },
        },
      ],
      courses: [
        {
          names: {
            pl: 'Hodowla zwierząt futerkowych',
            en: 'Fur Animal Breeding',
            uk: 'Хутрове звірівництво',
            ru: 'Пушное звероводство',
          },
          programs: {
            pl: 'Zootechnika, II°',
            en: 'Animal Science, MSc',
            uk: 'Зоотехнія, магістр',
            ru: 'Зоотехния, магистр',
          },
          coordinators: {
            pl: 'prof. dr hab. Piotr Jankowski',
            en: 'Prof. Piotr Jankowski',
            uk: 'проф. Пьотр Янковський',
            ru: 'проф. Пётр Янковский',
          },
        },
      ],
    },
  ];

  for (const t of fullTeams) {
    await prisma.team.create({
      data: {
        slug: t.slug,
        type: 'FULL',
        displayOrder: t.order,
        translations: {
          create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
            languageCode: lc,
            name: t.names[lc],
            researchDescription: t.research[lc],
            teachingDescription: t.teaching[lc],
          })),
        },
        members: {
          create: t.members.map((m) => {
            const [firstName, ...rest] = m.name.split(' ');
            const lastName = rest.join(' ');
            return {
              category: m.cat,
              employee: {
                create: {
                  firstName,
                  lastName,
                  photoUrl: m.photo,
                  profileSlug: slugify(m.name),
                  email: m.email,
                  phone: m.phone,
                  orcid: m.orcid,
                  officeLocation:
                    'pok. ' + Math.floor(Math.random() * 50 + 100),
                  translations: {
                    create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
                      languageCode: lc,
                      academicTitle: m.titles[lc],
                    })),
                  },
                  consultations: {
                    create: [
                      {
                        room: 'pok. ' + Math.floor(Math.random() * 50 + 100),
                        translations: {
                          create: [
                            {
                              languageCode: 'pl',
                              day: 'Środa',
                              time: '10:00 - 12:00',
                            },
                            {
                              languageCode: 'en',
                              day: 'Wednesday',
                              time: '10:00 - 12:00',
                            },
                            {
                              languageCode: 'uk',
                              day: 'Середа',
                              time: '10:00 - 12:00',
                            },
                            {
                              languageCode: 'ru',
                              day: 'Среда',
                              time: '10:00 - 12:00',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            };
          }),
        },
        publications: {
          create: t.publications.map((p) => ({
            year: p.year,
            authors: p.authors,
            journal: p.journal,
            doi: p.doi,
            translations: {
              create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
                languageCode: lc,
                title: p.titles[lc],
              })),
            },
          })),
        },
        projects: {
          create: t.projects.map((p) => ({
            years: p.years,
            translations: {
              create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
                languageCode: lc,
                title: p.titles[lc],
                funder: p.funders[lc],
              })),
            },
          })),
        },
        courses: {
          create: t.courses.map((c) => ({
            translations: {
              create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
                languageCode: lc,
                name: c.names[lc],
                program: c.programs[lc],
                coordinator: c.coordinators[lc],
              })),
            },
          })),
        },
      },
    });
    console.log(`  ✓ Zespół: ${t.slug}`);
  }

  // ──── 2 EXTERNAL teams ──────────────────────────────────────────────

  const externalTeams = [
    {
      slug: 'veterinary',
      order: 4,
      names: {
        pl: 'Pracownia Weterynaryjnej Ochrony Zdrowia Publicznego',
        en: 'Veterinary Public Health Protection Laboratory',
        uk: "Лабораторія ветеринарної охорони громадського здоров'я",
        ru: 'Лаборатория ветеринарной охраны общественного здоровья',
      },
      links: [
        {
          url: 'https://example.com',
          icon: 'globe',
          labels: {
            pl: 'Przejdź na stronę',
            en: 'Visit website',
            uk: 'Перейти на сайт',
            ru: 'Перейти на сайт',
          },
          order: 0,
        },
        {
          url: 'https://facebook.com',
          icon: 'facebook',
          labels: {
            pl: 'Facebook',
            en: 'Facebook',
            uk: 'Facebook',
            ru: 'Facebook',
          },
          order: 1,
        },
      ],
    },
    {
      slug: 'zlotnicka-pig-herdbooks',
      order: 5,
      names: {
        pl: 'Zespół ds. prowadzenia ksiąg hodowlanych świń rasy złotnickiej',
        en: 'Złotnicka Pig Breed Herdbook Team',
        uk: 'Група племінних книг свиней злотницької породи',
        ru: 'Группа племенных книг свиней злотницкой породы',
      },
      links: [
        {
          url: 'https://zlotnickieksiegi.up.poznan.pl/',
          icon: 'globe',
          labels: {
            pl: 'Przejdź na stronę',
            en: 'Visit website',
            uk: 'Перейти на сайт',
            ru: 'Перейти на сайт',
          },
          order: 0,
        },
        {
          url: 'https://facebook.com',
          icon: 'facebook',
          labels: {
            pl: 'Facebook',
            en: 'Facebook',
            uk: 'Facebook',
            ru: 'Facebook',
          },
          order: 1,
        },
      ],
    },
  ];

  for (const t of externalTeams) {
    await prisma.team.create({
      data: {
        slug: t.slug,
        type: 'EXTERNAL',
        displayOrder: t.order,
        translations: {
          create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
            languageCode: lc,
            name: t.names[lc],
          })),
        },
        links: {
          create: t.links.map((l) => ({
            url: l.url,
            icon: l.icon,
            displayOrder: l.order,
            translations: {
              create: (['pl', 'en', 'uk', 'ru'] as const).map((lc) => ({
                languageCode: lc,
                label: l.labels[lc],
              })),
            },
          })),
        },
      },
    });
    console.log(`  ✓ Zespół (zewn.): ${t.slug}`);
  }

  console.log('Zespoły utworzone pomyślnie!');
}
