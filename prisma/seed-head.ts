import { prisma } from '@/lib/prisma';

export async function seedHead() {
  console.log('Czyszczenie danych kierownika...');
  // Safe delete if the old table was removed
  await prisma.departmentHead.deleteMany();

  console.log('Tworzenie profilu kierownika...');

  await prisma.departmentHead.create({
    data: {
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
                translations: {
                  create: [
                    {
                      languageCode: 'pl',
                      day: 'Poniedziałek',
                      time: '10:00 - 12:00',
                    },
                    {
                      languageCode: 'en',
                      day: 'Monday',
                      time: '10:00 - 12:00',
                    },
                    {
                      languageCode: 'uk',
                      day: 'Понеділок',
                      time: '10:00 - 12:00',
                    },
                    {
                      languageCode: 'ru',
                      day: 'Понедельник',
                      time: '10:00 - 12:00',
                    },
                  ],
                },
              },
              {
                room: 'pok. 112',
                translations: {
                  create: [
                    {
                      languageCode: 'pl',
                      day: 'Wtorek',
                      time: '08:00 - 10:00',
                    },
                    {
                      languageCode: 'en',
                      day: 'Tuesday',
                      time: '08:00 - 10:00',
                    },
                    {
                      languageCode: 'uk',
                      day: 'Вівторок',
                      time: '08:00 - 10:00',
                    },
                    {
                      languageCode: 'ru',
                      day: 'Вторник',
                      time: '08:00 - 10:00',
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });
}
