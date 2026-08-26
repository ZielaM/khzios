import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Metadata } from 'next';
import BackLink from '@/components/BackLink';
import ContactProfile from '@/components/ContactProfile';
import AnimateOnce from '@/components/AnimateOnce';
import style from './page.module.scss';
import { getDepartmentHead } from '@/lib/head-queries';
import { resolveTranslation } from '@/lib/translations';
import { mapWorkingHours } from '@/lib/working-hours';

// ISR every 7 days
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Navbar');
  const head = await getDepartmentHead();

  if (head && head.employee) {
    const headTranslation =
      head.employee.translations.find((tr) => tr.languageCode === locale) ||
      head.employee.translations[0];
    const prefix = headTranslation?.academicTitle
      ? `${headTranslation.academicTitle} `
      : '';
    return {
      title: `${prefix}${head.employee.firstName} ${head.employee.lastName} - ${t('headOfDepartment')} | KHZIOS`,
    };
  }

  return { title: `${t('headOfDepartment')} | KHZIOS` };
}

export default async function HeadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTeam = await getTranslations('TeamPage');
  const tMember = await getTranslations('MemberProfile');
  const tNav = await getTranslations('Navbar');
  const tStruct = await getTranslations('StructurePage');

  const head = await getDepartmentHead();

  // Handle case where head is not yet configured in DB
  if (!head || !head.employee) {
    return (
      <div className={style.page}>
        <AnimateOnce>
          <BackLink href="/about-us/structure">
            {tTeam('backToStructure')}
          </BackLink>
        </AnimateOnce>
        <p>{tStruct('headNotConfigured')}</p>
      </div>
    );
  }

  const { translation: headTranslation } = resolveTranslation(
    head.employee.translations,
    locale
  );

  const workingHours = mapWorkingHours(head.workingHours, locale, {
    monday: tMember('monday'),
    tuesday: tMember('tuesday'),
    wednesday: tMember('wednesday'),
    thursday: tMember('thursday'),
    friday: tMember('friday'),
    saturday: tMember('saturday'),
    sunday: tMember('sunday'),
  });

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/about-us/structure">
          {tTeam('backToStructure')}
        </BackLink>
      </AnimateOnce>

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
        workingHours={workingHours}
        hoursTitle={tMember('consultationsLabel')}
        photoUrl={head.employee.photoUrl || undefined}
      />
    </div>
  );
}
