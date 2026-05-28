import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, routing } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';
import { Metadata } from 'next';
import HeadProfile from '@/components/HeadProfile';
import AnimateOnce from '@/components/AnimateOnce';
import style from './page.module.scss';
import { getDepartmentHead } from '@/lib/head-queries';
import { resolveTranslation } from '@/lib/translations';

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
  return { title: `${t('headOfDepartment')} | KHZIOS` };
}

export default async function HeadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTeam = await getTranslations('TeamPage');
  const tMember = await getTranslations('MemberProfile');
  const tNav = await getTranslations('Navbar');

  const head = await getDepartmentHead();

  // Handle case where head is not yet configured in DB
  if (!head) {
    return (
      <div className={style.page}>
        <AnimateOnce>
          <Link href="/about-us/structure" className={style.backLink}>
            <ChevronLeft size={20} />
            {tTeam('backToStructure')}
          </Link>
        </AnimateOnce>
        <p>Kierownik katedry nie został jeszcze dodany w systemie.</p>
      </div>
    );
  }

  const { translation: headTranslation } = resolveTranslation(
    head.translations,
    locale
  );

  const defaultDays = [
    { key: 'monday', order: 1 },
    { key: 'tuesday', order: 2 },
    { key: 'wednesday', order: 3 },
    { key: 'thursday', order: 4 },
    { key: 'friday', order: 5 },
    { key: 'saturday', order: 6 },
    { key: 'sunday', order: 7 },
  ] as const;

  const workingHours = defaultDays.map(({ key, order }) => {
    const dbDay = head.workingHours.find((wh) => wh.displayOrder === order);

    if (dbDay) {
      const { translation: whTranslation } = resolveTranslation(
        dbDay.translations,
        locale
      );
      return {
        day: whTranslation?.day || tMember(key),
        hours: whTranslation?.hours?.trim() || '',
      };
    }

    return {
      day: tMember(key),
      hours: '',
    };
  });

  return (
    <div className={style.page}>
      <AnimateOnce>
        <Link href="/about-us/structure" className={style.backLink}>
          <ChevronLeft size={20} />
          {tTeam('backToStructure')}
        </Link>
      </AnimateOnce>

      <HeadProfile
        name={head.name}
        title={headTranslation?.title || tNav('headOfDepartment')}
        email={head.email || ''}
        phone={head.phone || ''}
        officeLocation={head.officeLocation || ''}
        workingHours={workingHours}
        photoUrl={head.photoUrl || undefined}
      />
    </div>
  );
}
