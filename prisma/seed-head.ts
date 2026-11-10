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
                weekday: 1,
                startTime: '10:00',
                endTime: '12:00',
              },
              {
                room: 'pok. 112',
                weekday: 2,
                startTime: '08:00',
                endTime: '10:00',
                translations: {
                  create: [
                    { languageCode: 'pl', note: 'Po wcześniejszym umówieniu' },
                    { languageCode: 'en', note: 'By appointment' },
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
