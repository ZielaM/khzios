import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { getPathname, Link } from '@/i18n/routing';
import { setPageLocale } from '@/i18n/page-locale';
import AnimateOnce from '@/components/AnimateOnce';
import HeroSlideshow from '@/components/HeroSlideshow';
import JsonLd from '@/components/JsonLd';
import RecentNewsServer from '@/components/RecentNews/RecentNewsServer';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';
import { excerpt, stripHtml } from '@/lib/content-utils';
import { LOGO_IMAGE, pageMetadata, toAbsoluteUrl } from '@/lib/seo';
import { getSectionImages, IMAGE_SECTIONS } from '@/lib/site-images';
import { renderOnFirstRequest } from '@/lib/static-params';
import {
  getAllTeams,
  getDepartmentStats,
  RECENT_YEARS,
} from '@/lib/team-queries';
import { teamHref } from '@/lib/team-routes';
import { resolveTranslation } from '@/lib/translations';
import styles from './page.module.scss';

// The latest news on this page should not trail the articles by more than a
// day; everything else here changes far less often.
export const revalidate = 86400;
export const generateStaticParams = renderOnFirstRequest;

const FACULTY_URL = 'https://wwz.up.poznan.pl/';

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
  const tNav = await getTranslations('Navbar');
  const tFooter = await getTranslations('Footer');
  const [teams, stats] = await Promise.all([
    getAllTeams(),
    getDepartmentStats(),
  ]);
  const heroImages = getSectionImages(IMAGE_SECTIONS.hero, locale);

  const researchAreas = teams.flatMap((team) => {
    const { translation } = resolveTranslation(team.translations, locale);
    if (!translation) return [];
    return [
      {
        team,
        name: stripHtml(translation.name),
        summary: excerpt(stripHtml(translation.researchDescription ?? ''), 170),
      },
    ];
  });

  const audience = [
    { key: 'students', href: '/student' as const },
    { key: 'candidates', href: FACULTY_URL },
    { key: 'researchers', href: '/about-us/publications' as const },
    { key: 'partners', href: '/contact' as const },
  ] as const;

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
    ...(heroImages.length > 0 && {
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

  const num = (chunks: React.ReactNode) => (
    <strong className={styles.statNumber}>{chunks}</strong>
  );

  return (
    <div className={styles.main}>
      <JsonLd data={jsonLd} />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{tFooter('university')}</p>
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
        {heroImages.length > 0 && (
          <div className={styles.heroMedia}>
            <HeroSlideshow images={heroImages} />
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="home-news">
        <div className={styles.sectionHeader}>
          <h2 id="home-news" className={styles.sectionTitle}>
            {t('recentNewsTitle')}
          </h2>
          <Link href="/news" className={styles.moreLink}>
            {t('viewAllNews')}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
        <Suspense fallback={<RecentNewsSkeleton />}>
          <RecentNewsServer locale={locale} />
        </Suspense>
      </section>

      <AnimateOnce>
        <section className={styles.section} aria-labelledby="home-audience">
          <h2 id="home-audience" className={styles.sectionTitle}>
            {t('audienceTitle')}
          </h2>
          <ul className={styles.audience}>
            {audience.map(({ key, href }) => (
              <li key={key} className={styles.audienceItem}>
                <h3 className={styles.audienceTitle}>
                  {href.startsWith('http') ? (
                    <a href={href} className={styles.audienceLink}>
                      {t(`${key}Title`)}
                    </a>
                  ) : (
                    <Link
                      href={href as Exclude<typeof href, typeof FACULTY_URL>}
                      className={styles.audienceLink}
                    >
                      {t(`${key}Title`)}
                    </Link>
                  )}
                </h3>
                <p className={styles.audienceDesc}>{t(`${key}Desc`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </AnimateOnce>

      {researchAreas.length > 0 && (
        <AnimateOnce>
          <section className={styles.section} aria-labelledby="home-research">
            <div className={styles.sectionHeader}>
              <h2 id="home-research" className={styles.sectionTitle}>
                {t('researchTitle')}
              </h2>
              <Link href="/about-us/structure" className={styles.moreLink}>
                {tNav('structure')}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>

            <ul className={styles.stats} aria-label={t('statsLabel')}>
              <li>{t.rich('statTeams', { count: stats.teams, num })}</li>
              <li>
                {t.rich('statEmployees', { count: stats.employees, num })}
              </li>
              <li>
                {t.rich('statPublications', {
                  count: stats.publications,
                  years: RECENT_YEARS,
                  num,
                })}
              </li>
            </ul>

            <ul className={styles.research}>
              {researchAreas.map(({ team, name, summary }) => (
                <li key={team.id} className={styles.researchItem}>
                  <h3 className={styles.researchTitle}>
                    <Link href={teamHref(team, locale)}>{name}</Link>
                  </h3>
                  {summary && <p className={styles.researchDesc}>{summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        </AnimateOnce>
      )}
    </div>
  );
}
