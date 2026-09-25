import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { Metadata } from 'next';
import ContactProfile from '@/components/ContactProfile';
import LocationMap from '@/components/LocationMap';
import PageBanner from '@/components/PageBanner';
import BackLink from '@/components/BackLink';
import AnimateOnce from '@/components/AnimateOnce';
import style from './page.module.scss';
import { getSecretariat } from '@/lib/secretariat-queries';
import { resolveTranslation } from '@/lib/translations';
import { mapWorkingHours } from '@/lib/working-hours';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import { buildShareMetadata } from '@/lib/seo';
import { renderOnFirstRequest } from '@/lib/static-params';

export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Navbar');
  const tHome = await getTranslations('HomePage');
  const title = `${t('contact')} | KHZIOS`;
  const image = getSectionImage(
    IMAGE_SECTIONS.contact,
    locale,
    tHome('heroTitle')
  );

  return { title, ...buildShareMetadata(title, image) };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

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
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
      </AnimateOnce>
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
          <AnimateOnce className={style.locationPhoto}>
            <PageBanner
              image={buildingImage}
              className={style.locationPhotoInner}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </AnimateOnce>
          <LocationMap />
        </div>
      ) : (
        <LocationMap />
      )}
    </div>
  );
}
