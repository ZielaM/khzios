import { prisma } from '@/lib/prisma';

export async function seedHead() {
  console.log('Czyszczenie danych kierownika...');
  // Safe delete if the old table was removed
  await prisma.departmentHead.deleteMany();

  console.log('Tworzenie profilu kierownika...');

  await prisma.departmentHead.create({
    data: {
      workingHours: {
        create: [
          {
            displayOrder: 1,
            translations: {
              create: [
                {
                  languageCode: 'pl',
                  day: 'Poniedziałek',
                  hours: '08:00 - 16:00',
                },
                { languageCode: 'en', day: 'Monday', hours: '08:00 - 16:00' },
                {
                  languageCode: 'uk',
                  day: 'Понеділок',
                  hours: '08:00 - 16:00',
                },
                {
                  languageCode: 'ru',
                  day: 'Понедельник',
                  hours: '08:00 - 16:00',
                },
              ],
            },
          },
          {
            displayOrder: 2,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Wtorek', hours: '08:00 - 16:00' },
                { languageCode: 'en', day: 'Tuesday', hours: '08:00 - 16:00' },
                { languageCode: 'uk', day: 'Вівторок', hours: '08:00 - 16:00' },
                { languageCode: 'ru', day: 'Вторник', hours: '08:00 - 16:00' },
              ],
            },
          },
          {
            displayOrder: 3,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Środa', hours: '08:00 - 16:00' },
                {
                  languageCode: 'en',
                  day: 'Wednesday',
                  hours: '08:00 - 16:00',
                },
                { languageCode: 'uk', day: 'Середа', hours: '08:00 - 16:00' },
                { languageCode: 'ru', day: 'Среда', hours: '08:00 - 16:00' },
              ],
            },
          },
          {
            displayOrder: 4,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Czwartek', hours: '08:00 - 16:00' },
                { languageCode: 'en', day: 'Thursday', hours: '08:00 - 16:00' },
                { languageCode: 'uk', day: 'Четвер', hours: '08:00 - 16:00' },
                { languageCode: 'ru', day: 'Четверг', hours: '08:00 - 16:00' },
              ],
            },
          },
          {
            displayOrder: 5,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Piątek', hours: '08:00 - 16:00' },
                { languageCode: 'en', day: 'Friday', hours: '08:00 - 16:00' },
                { languageCode: 'uk', day: "П'ятниця", hours: '08:00 - 16:00' },
                { languageCode: 'ru', day: 'Пятница', hours: '08:00 - 16:00' },
              ],
            },
          },
        ],
      },
      employee: {
        create: {
          firstName: 'Piotr',
          lastName: 'Ślósarz',
          email: 'piotr.slosarz@up.poznan.pl',
          phone: '+48 61 848 72 23',
          officeLocation: 'ul. Szydłowska 50, 60-656 Poznań, pok. 112',
          profileSlug: 'piotr-slosarz',
          translations: {
            create: [
              {
                languageCode: 'pl',
                academicTitle: 'prof. dr hab.',
              },
              {
                languageCode: 'en',
                academicTitle: 'Professor',
              },
              {
                languageCode: 'uk',
                academicTitle: 'проф. д-р габ.',
              },
              {
                languageCode: 'ru',
                academicTitle: 'проф. д-р габ.',
              },
            ],
          },
          consultations: {
            create: [
              {
                room: 'pok. 112',
                date: new Date('2026-10-12T00:00:00Z'),
                time: '10:00 - 12:00',
              },
              {
                room: 'pok. 112',
                date: new Date('2026-10-13T00:00:00Z'),
                time: '08:00 - 10:00',
              },
            ],
          },
        },
      },
    },
  });
}
