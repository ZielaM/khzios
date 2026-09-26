import { getTranslations } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { Metadata } from 'next';
import ContactProfile from '@/components/ContactProfile';
import LocationMap from '@/components/LocationMap';
import PageBanner from '@/components/PageBanner';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import { getSecretariat } from '@/lib/secretariat-queries';
import { resolveTranslation } from '@/lib/translations';
import { mapWorkingHours } from '@/lib/working-hours';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import { renderOnFirstRequest } from '@/lib/static-params';
import { pageMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';

export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('Navbar');
  const tContact = await getTranslations('ContactPage');
  const tHome = await getTranslations('HomePage');
  return pageMetadata({
    locale,
    href: '/contact',
    title: t('contact'),
    description: tContact('metaDescription'),
    image: getSectionImage(IMAGE_SECTIONS.contact, locale, tHome('heroTitle')),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);

  const tMember = await getTranslations('MemberProfile');
  const tNav = await getTranslations('Navbar');
  const tStruct = await getTranslations('StructurePage');

  const secretariat = await getSecretariat();
  const tHome = await getTranslations('HomePage');
  // Fallback alt names the department, since the photo shows its building
  const buildingImage = getSectionImage(
    IMAGE_SECTIONS.contact,
    locale,
    tHome('heroTitle')
  );

  if (!secretariat) {
    return (
      <div className={style.page}>
        <p>{tStruct('secretariatNotConfigured')}</p>
      </div>
    );
  }

  const { translation: secTranslation } = resolveTranslation(
    secretariat.translations,
    locale
  );

  const workingHours = mapWorkingHours(secretariat.workingHours, locale, {
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
      <BackLink href="/">{tStruct('backToHome')}</BackLink>

      <ContactProfile
        name={secTranslation?.title || tNav('contact')}
        title=""
        email={secretariat.email || ''}
        phone={secretariat.phone || ''}
        officeLocation={secretariat.officeLocation || ''}
        workingHours={workingHours}
        photoUrl={secretariat.photoUrl || undefined}
        fallbackIcon={
          <Briefcase aria-hidden="true" size={64} strokeWidth={1.5} />
        }
      />
      {buildingImage ? (
        <div className={style.location}>
          <div className={style.locationPhoto}>
            <PageBanner
              image={buildingImage}
              className={style.locationPhotoInner}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <LocationMap />
        </div>
      ) : (
        <LocationMap />
      )}
    </div>
  );
}
