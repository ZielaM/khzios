import { Suspense } from 'react';
import styles from './page.module.scss';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import RecentNewsServer from '@/components/RecentNews/RecentNewsServer';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';
import AnimateOnce from '@/components/AnimateOnce';
import HeroSlideshow from '@/components/HeroSlideshow';
import { getSectionImages, IMAGE_SECTIONS } from '@/lib/site-images';
import { LOGO_IMAGE, pageMetadata, toAbsoluteUrl } from '@/lib/seo';
import { getPathname } from '@/i18n/routing';
import type { Metadata } from 'next';
import clsx from 'clsx';
import { renderOnFirstRequest } from '@/lib/static-params';
import { BookOpen, GraduationCap, Network, Phone } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { setPageLocale } from '@/i18n/page-locale';

// The latest news on this page should not trail the articles by more than a
// day; everything else here changes far less often.
export const revalidate = 86400;
export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);
  // Title and description come from the layout defaults
  return pageMetadata({ locale, href: '/' });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setPageLocale(locale);
  const t = await getTranslations('HomePage');
  const heroImages = getSectionImages(IMAGE_SECTIONS.hero, locale);
  const hasHeroImages = heroImages.length > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: t('heroTitle'),
    description: t('heroSubtitle'),
    url: toAbsoluteUrl(getPathname({ locale, href: '/' })),
    logo: toAbsoluteUrl(LOGO_IMAGE),
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Uniwersytet Przyrodniczy w Poznaniu',
      url: 'https://up.poznan.pl',
    },
    ...(hasHeroImages && {
      image: heroImages.map((image) => toAbsoluteUrl(image.src)),
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ul. Szydłowska 50',
      addressLocality: 'Poznań',
      postalCode: '60-656',
      addressCountry: 'PL',
    },
  };

  return (
    <div className={styles.main}>
      <JsonLd data={jsonLd} />
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section
        className={clsx(styles.hero, hasHeroImages && styles.heroWithImages)}
      >
        {hasHeroImages && <HeroSlideshow images={heroImages} />}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
          <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
          <div className={styles.heroActions}>
            <Link href="/about-us" className={styles.primaryBtn}>
              {t('btnAboutUs')}
            </Link>
            <Link href="/student" className={styles.secondaryBtn}>
              {t('btnStudent')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent News ────────────────────────────────────────────────── */}
      <section className={styles.newsSection}>
        <AnimateOnce>
          <h2 className={styles.sectionTitle}>{t('recentNewsTitle')}</h2>
        </AnimateOnce>

        <Suspense fallback={<RecentNewsSkeleton />}>
          <RecentNewsServer locale={locale} />
        </Suspense>

        <AnimateOnce>
          <div className={styles.newsFooter}>
            <Link href="/news">
              {t('viewAllNews')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimateOnce>
      </section>

      {/* ── Quick Links (Bento Grid) ──────────────────────────────────── */}
      <AnimateOnce>
        <h2 className={styles.sectionTitle}>{t('quickLinksTitle')}</h2>
      </AnimateOnce>

      <AnimateOnce>
        <div className={styles.bentoGrid}>
          <Link href="/student" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper} aria-hidden="true">
              <GraduationCap aria-hidden="true" size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('btnStudent')}</h3>
              <p className={styles.cardDesc}>{t('linkStudentsDesc')}</p>
            </div>
            <ArrowRight
              size={20}
              className={styles.cardArrow}
              aria-hidden="true"
            />
          </Link>

          <Link href="/about-us/structure" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper} aria-hidden="true">
              <Network aria-hidden="true" size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkStructureTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkStructureDesc')}</p>
            </div>
            <ArrowRight
              size={20}
              className={styles.cardArrow}
              aria-hidden="true"
            />
          </Link>

          <Link href="/about-us/publications" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper} aria-hidden="true">
              <BookOpen aria-hidden="true" size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkPublicationsTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkPublicationsDesc')}</p>
            </div>
            <ArrowRight
              size={20}
              className={styles.cardArrow}
              aria-hidden="true"
            />
          </Link>

          <Link href="/contact" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper} aria-hidden="true">
              <Phone aria-hidden="true" size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkContactTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkContactDesc')}</p>
            </div>
            <ArrowRight
              size={20}
              className={styles.cardArrow}
              aria-hidden="true"
            />
          </Link>
        </div>
      </AnimateOnce>
    </div>
  );
}
