import { prisma } from '@/lib/prisma';

export async function seedHead() {
  console.log('Czyszczenie danych kierownika...');
  await prisma.departmentHeadHourTranslation.deleteMany();
  await prisma.departmentHeadHour.deleteMany();
  await prisma.departmentHeadTranslation.deleteMany();
  await prisma.departmentHead.deleteMany();

  console.log('Tworzenie profilu kierownika...');

  await prisma.departmentHead.create({
    data: {
      name: 'Piotr Ślósarz',
      email: 'piotr.slosarz@up.poznan.pl',
      phone: '+48 61 848 72 23',
      officeLocation: 'ul. Wołyńska 33, 60-637 Poznań, pok. 112',
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Kierownik Katedry',
            academicTitle: 'prof. dr hab.',
          },
          {
            languageCode: 'en',
            title: 'Head of Department',
            academicTitle: 'Full Professor',
          },
          {
            languageCode: 'uk',
            title: 'Завідувач кафедри',
            academicTitle: 'проф. д-р габ.',
          },
          {
            languageCode: 'ru',
            title: 'Заведующий кафедрой',
            academicTitle: 'проф. д-р габ.',
          },
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
                  hours: '10:00 - 12:00',
                },
                { languageCode: 'en', day: 'Monday', hours: '10:00 - 12:00' },
                {
                  languageCode: 'uk',
                  day: 'Понеділок',
                  hours: '10:00 - 12:00',
                },
                {
                  languageCode: 'ru',
                  day: 'Понедельник',
                  hours: '10:00 - 12:00',
                },
              ],
            },
          },
          {
            displayOrder: 2,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Wtorek', hours: '08:00 - 10:00' },
                { languageCode: 'en', day: 'Tuesday', hours: '08:00 - 10:00' },
                { languageCode: 'uk', day: 'Вівторок', hours: '08:00 - 10:00' },
                { languageCode: 'ru', day: 'Вторник', hours: '08:00 - 10:00' },
              ],
            },
          },
          {
            displayOrder: 3,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Środa', hours: 'Nieczynne' },
                { languageCode: 'en', day: 'Wednesday', hours: 'Closed' },
                { languageCode: 'uk', day: 'Середа', hours: 'Зачинено' },
                { languageCode: 'ru', day: 'Среда', hours: 'Закрыто' },
              ],
            },
          },
          {
            displayOrder: 4,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Czwartek', hours: '12:00 - 14:00' },
                { languageCode: 'en', day: 'Thursday', hours: '12:00 - 14:00' },
                { languageCode: 'uk', day: 'Четвер', hours: '12:00 - 14:00' },
                { languageCode: 'ru', day: 'Четверг', hours: '12:00 - 14:00' },
              ],
            },
          },
          {
            displayOrder: 5,
            translations: {
              create: [
                { languageCode: 'pl', day: 'Piątek', hours: 'Nieczynne' },
                { languageCode: 'en', day: 'Friday', hours: 'Closed' },
                { languageCode: 'uk', day: "П'ятниця", hours: 'Зачинено' },
                { languageCode: 'ru', day: 'Пятница', hours: 'Закрыто' },
              ],
            },
          },
        ],
      },
    },
  });
}
