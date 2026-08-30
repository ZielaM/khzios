import { prisma } from '@/lib/prisma';

export async function seedAnnouncements() {
  const today = new Date();

  // Future announcement
  const d1 = new Date(today);
  d1.setDate(today.getDate() + 2);

  await prisma.studentAnnouncement.create({
    data: {
      date: d1,
      important: false,
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Zastępstwo za dr. Kowalskiego',
            content:
              'Zajęcia w dniu 15.10 zostaną poprowadzone przez dr. Nowaka w sali 204.',
          },
          {
            languageCode: 'en',
            title: 'Substitution for Dr. Kowalski',
            content: 'Classes on Oct 15 will be led by Dr. Nowak in room 204.',
          },
          {
            languageCode: 'uk',
            title: 'Заміна для д-ра Ковальського',
            content: 'Заняття 15 жовтня проведе д-р Новак в аудиторії 204.',
          },
        ],
      },
    },
  });

  // Future urgent announcement
  const d2 = new Date(today);
  d2.setDate(today.getDate() + 1);

  await prisma.studentAnnouncement.create({
    data: {
      date: d2,
      important: true,
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Odwołane zajęcia laboratoryjne',
            content:
              'Z powodu awarii sprzętu zajęcia laboratoryjne w tym tygodniu są odwołane.',
          },
          {
            languageCode: 'en',
            title: 'Canceled laboratory classes',
            content:
              'Due to equipment failure, laboratory classes this week are canceled.',
          },
          {
            languageCode: 'uk',
            title: 'Скасовано лабораторні заняття',
            content:
              'Через несправність обладнання лабораторні заняття цього тижня скасовуються.',
          },
        ],
      },
    },
  });

  // Past announcement
  const d3 = new Date(today);
  d3.setDate(today.getDate() - 3);

  await prisma.studentAnnouncement.create({
    data: {
      date: d3,
      important: false,
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Przypomnienie o wycieczce',
            content:
              'Proszę pamiętać o zabraniu odpowiedniego ubioru na terenówkę.',
          },
          {
            languageCode: 'en',
            title: 'Trip reminder',
            content:
              'Please remember to bring appropriate clothing for the field trip.',
          },
          {
            languageCode: 'uk',
            title: 'Нагадування про поїздку',
            content:
              'Будь ласка, не забудьте взяти відповідний одяг для екскурсії.',
          },
        ],
      },
    },
  });

  console.log('Seed announcements done');
}
