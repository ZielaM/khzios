import { prisma } from '@/lib/prisma';

export async function seedSecretariat() {
  console.log('Czyszczenie danych sekretariatu...');
  await prisma.secretariatHourTranslation.deleteMany();
  await prisma.secretariatHour.deleteMany();
  await prisma.secretariatTranslation.deleteMany();
  await prisma.secretariat.deleteMany();

  console.log('Tworzenie profilu sekretariatu...');

  await prisma.secretariat.create({
    data: {
      email: 'khzios@up.poznan.pl',
      phone: '+48 61 848 72 23',
      officeLocation: 'ul. Szydłowska 50, 60-656 Poznań, pok. 110',
      translations: {
        create: [
          { languageCode: 'pl', title: 'Sekretariat Katedry' },
          { languageCode: 'en', title: 'Department Secretariat' },
          { languageCode: 'uk', title: 'Секретаріат кафедри' },
          { languageCode: 'ru', title: 'Секретариат кафедры' },
        ],
      },
      workingHours: {
        create: [
          {
            displayOrder: 1,
            translations: {
              create: [
                {
                  languageCode: 'pl',
                  day: 'Poniedziałek',
                  hours: '08:00 - 14:00',
                },
                { languageCode: 'en', day: 'Monday', hours: '08:00 - 14:00' },
                {
                  languageCode: 'uk',
                  day: 'Понеділок',
                  hours: '08:00 - 14:00',
                },
                {
                  languageCode: 'ru',
                  day: 'Понедельник',
                  hours: '08:00 - 14:00',
                },
              ],
            },
          },
          {
            displayOrder: 2,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Wtorek', hours: '08:00 - 14:00' },
                { languageCode: 'en', day: 'Tuesday', hours: '08:00 - 14:00' },
                { languageCode: 'uk', day: 'Вівторок', hours: '08:00 - 14:00' },
                { languageCode: 'ru', day: 'Вторник', hours: '08:00 - 14:00' },
              ],
            },
          },
          {
            displayOrder: 3,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Środa', hours: '08:00 - 14:00' },
                {
                  languageCode: 'en',
                  day: 'Wednesday',
                  hours: '08:00 - 14:00',
                },
                { languageCode: 'uk', day: 'Середа', hours: '08:00 - 14:00' },
                { languageCode: 'ru', day: 'Среда', hours: '08:00 - 14:00' },
              ],
            },
          },
          {
            displayOrder: 4,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Czwartek', hours: '08:00 - 14:00' },
                { languageCode: 'en', day: 'Thursday', hours: '08:00 - 14:00' },
                { languageCode: 'uk', day: 'Четвер', hours: '08:00 - 14:00' },
                { languageCode: 'ru', day: 'Четверг', hours: '08:00 - 14:00' },
              ],
            },
          },
          {
            displayOrder: 5,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Piątek', hours: '08:00 - 14:00' },
                { languageCode: 'en', day: 'Friday', hours: '08:00 - 14:00' },
                { languageCode: 'uk', day: "П'ятниця", hours: '08:00 - 14:00' },
                { languageCode: 'ru', day: 'Пятница', hours: '08:00 - 14:00' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✓ Profil sekretariatu został utworzony');
}
