import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { renderOnFirstRequest } from '@/lib/static-params';
import { Metadata } from 'next';
import { ArrowRight, BookOpen, Network } from 'lucide-react';
import BackLink from '@/components/BackLink';
import HeroSlideshow from '@/components/HeroSlideshow';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import style from './page.module.scss';
import { pageMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';

// ISR every 7 days
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

// The layout loads the team menu from the database
export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('AboutUsPage');
  return pageMetadata({
    locale,
    href: '/about-us',
    title: t('title'),
    description: t('description'),
    image: getSectionImage(IMAGE_SECTIONS.aboutUs, locale, t('title')),
  });
}

export default async function AboutUsPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('AboutUsPage');
  const tStruct = await getTranslations('StructurePage');
  const heroImage = getSectionImage(IMAGE_SECTIONS.aboutUs, locale, t('title'));

  return (
    <div className={style.page}>
      <BackLink href="/">{tStruct('backToHome')}</BackLink>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={style.hero}>
        {heroImage && <HeroSlideshow images={[heroImage]} />}
        <div className={style.heroContent}>
          <h1 className={style.heroTitle}>{t('title')}</h1>
          <p className={style.heroDesc}>{t('description')}</p>
        </div>
      </section>

      <div className={style.grid}>
        <Link href="/about-us/structure" className={style.card}>
          <div className={style.cardIconWrapper} aria-hidden="true">
            <Network aria-hidden="true" size={26} />
          </div>
          <h2 className={style.cardTitle}>{t('structureCardTitle')}</h2>
          <p className={style.cardDesc}>{t('structureCardDesc')}</p>
          <span className={style.cardFooter}>
            {t('viewDetails')}
            <ArrowRight
              aria-hidden="true"
              size={16}
              className={style.cardArrow}
            />
          </span>
        </Link>

        <Link href="/about-us/publications" className={style.card}>
          <div className={style.cardIconWrapper} aria-hidden="true">
            <BookOpen aria-hidden="true" size={26} />
          </div>
          <h2 className={style.cardTitle}>{t('publicationsCardTitle')}</h2>
          <p className={style.cardDesc}>{t('publicationsCardDesc')}</p>
          <span className={style.cardFooter}>
            {t('viewDetails')}
            <ArrowRight
              aria-hidden="true"
              size={16}
              className={style.cardArrow}
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
