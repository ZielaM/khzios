import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { renderOnFirstRequest } from '@/lib/static-params';
import { Metadata } from 'next';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import style from './page.module.scss';
import { pageMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';
import PageHeader from '@/components/PageHeader';
import { getAllTeams } from '@/lib/team-queries';
import { teamHref } from '@/lib/team-routes';
import { resolveTranslation } from '@/lib/translations';
import { stripHtml } from '@/lib/content-utils';

// Refreshed after every panel edit and daily (see revalidatePublicSite)
export const revalidate = 86400;

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
    image: await getSectionImage(IMAGE_SECTIONS.aboutUs, locale, t('title')),
  });
}

export default async function AboutUsPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('AboutUsPage');
  const heroImage = await getSectionImage(
    IMAGE_SECTIONS.aboutUs,
    locale,
    t('title')
  );
  const teams = await getAllTeams();

  return (
    <div className={style.page}>
      <PageHeader
        title={t('title')}
        lead={t('description')}
        breadcrumbs={[]}
        image={heroImage}
      />

      <div className={style.content}>
        <section aria-labelledby="about-overview">
          <h2 id="about-overview">{t('overviewTitle')}</h2>
          <p>{t('overview')}</p>
        </section>

        {teams.length > 0 && (
          <section aria-labelledby="about-teams">
            <h2 id="about-teams">{t('teamsTitle')}</h2>
            <p>{t('teamsIntro')}</p>
            <ul className={style.teams}>
              {teams.map((team) => {
                const { translation } = resolveTranslation(
                  team.translations,
                  locale
                );
                if (!translation) return null;
                return (
                  <li key={team.id}>
                    <Link href={teamHref(team, locale)}>
                      {stripHtml(translation.name)}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p>
              {t.rich('teamsMore', {
                link: (chunks) => (
                  <Link href="/about-us/structure">{chunks}</Link>
                ),
              })}
            </p>
          </section>
        )}

        <section aria-labelledby="about-work">
          <h2 id="about-work">{t('workTitle')}</h2>
          <p>
            {t.rich('workText', {
              link: (chunks) => (
                <Link href="/about-us/publications">{chunks}</Link>
              ),
            })}
          </p>
        </section>

        <section aria-labelledby="about-contact">
          <h2 id="about-contact">{t('contactTitle')}</h2>
          <p>
            {t.rich('contactText', {
              head: (chunks) => (
                <Link href="/about-us/structure/head">{chunks}</Link>
              ),
              contact: (chunks) => <Link href="/contact">{chunks}</Link>,
            })}
          </p>
        </section>
      </div>
    </div>
  );
}
