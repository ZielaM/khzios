import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ContactProfile from '@/components/ContactProfile';
import style from './page.module.scss';
import { getDepartmentHead } from '@/lib/head-queries';
import { resolveTranslation } from '@/lib/translations';
import { formatHours, weekdayName } from '@/lib/weekdays';
import { renderOnFirstRequest } from '@/lib/static-params';
import { pageMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';
import Breadcrumbs from '@/components/Breadcrumbs';

// Refreshed after every panel edit and daily (see revalidatePublicSite)
export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('Navbar');
  const tStruct = await getTranslations('StructurePage');
  const head = await getDepartmentHead();

  let title = t('headOfDepartment');
  if (head?.employee) {
    const { translation } = resolveTranslation(
      head.employee.translations,
      locale
    );
    const name = [
      translation?.academicTitle,
      head.employee.firstName,
      head.employee.lastName,
    ]
      .filter(Boolean)
      .join(' ');
    title = `${name} – ${t('headOfDepartment')}`;
  }

  return pageMetadata({
    locale,
    href: '/about-us/structure/head',
    title,
    description: tStruct('headDesc'),
  });
}

export default async function HeadPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);

  const tMember = await getTranslations('MemberProfile');
  const tNav = await getTranslations('Navbar');
  const tStruct = await getTranslations('StructurePage');
  const tStudents = await getTranslations('StudentsPage');

  const head = await getDepartmentHead();
  const crumbs = [
    { label: tNav('aboutUs'), href: '/about-us' as const },
    { label: tNav('structure'), href: '/about-us/structure' as const },
  ];

  // Handle case where head is not yet configured in DB
  if (!head || !head.employee) {
    return (
      <div className={style.page}>
        <Breadcrumbs
          items={crumbs}
          current={tNav('headOfDepartment')}
          className={style.breadcrumbs}
        />

        <p>{tStruct('headNotConfigured')}</p>
      </div>
    );
  }

  const { translation: headTranslation } = resolveTranslation(
    head.employee.translations,
    locale
  );

  // The same weekly slots as in the consultations table for students
  const consultations = head.employee.consultations.map((c) => ({
    day: weekdayName(c.weekday, locale),
    hours: [
      formatHours(c.startTime, c.endTime),
      c.room,
      resolveTranslation(c.translations, locale).translation?.note,
    ]
      .filter(Boolean)
      .join(', '),
  }));

  return (
    <div className={style.page}>
      <Breadcrumbs
        items={crumbs}
        current={tNav('headOfDepartment')}
        className={style.breadcrumbs}
      />

      <ContactProfile
        name={
          headTranslation?.academicTitle
            ? `${headTranslation.academicTitle} ${head.employee.firstName} ${head.employee.lastName}`
            : `${head.employee.firstName} ${head.employee.lastName}`
        }
        title={tNav('headOfDepartment')}
        email={head.employee.email || ''}
        phone={head.employee.phone || ''}
        officeLocation={head.employee.officeLocation || ''}
        workingHours={consultations}
        hoursTitle={tMember('consultationsLabel')}
        noHoursLabel={tStudents('noConsultations')}
        photoUrl={head.employee.photoUrl || undefined}
      />
    </div>
  );
}
