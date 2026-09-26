import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Crown, Users } from 'lucide-react';
import { getAllTeams } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import style from './page.module.scss';
import { renderOnFirstRequest } from '@/lib/static-params';
import { teamHref } from '@/lib/team-routes';
import { pageMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';
import PageHeader from '@/components/PageHeader';

// ISR every 7 days
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('StructurePage');
  return pageMetadata({
    locale,
    href: '/about-us/structure',
    title: t('title'),
    description: t('description'),
  });
}

export default async function StructurePage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations('StructurePage');
  const tNav = await getTranslations('Navbar');
  const teams = await getAllTeams();
  const teamImages = new Map(
    teams.map((team) => [
      team.id,
      getSectionImage(IMAGE_SECTIONS.team(team.slug), locale),
    ])
  );
  // Once any team has a photo, give the rest a placeholder so cards align
  const showThumbnails = [...teamImages.values()].some(Boolean);

  return (
    <div className={style.page}>
      <PageHeader
        title={t('title')}
        lead={t('description')}
        breadcrumbs={[{ label: tNav('aboutUs'), href: '/about-us' }]}
      />

      {/* ── Teams ─────────────────────────────────────────────── */}

      <h2 className={style.sectionTitle}>{t('teamsTitle')}</h2>

      <div className={style.teamsSection}>
        <div className={style.teamsGrid}>
          {teams.map((team) => {
            const { translation } = resolveTranslation(
              team.translations,
              locale
            );
            if (!translation) return null;

            const image = teamImages.get(team.id);

            return (
              <Link
                key={team.id}
                href={teamHref(team, locale)}
                className={style.card}
              >
                {showThumbnails && (
                  // Decorative: the card's heading already names the team
                  <div className={style.cardImage} aria-hidden="true">
                    {image ? (
                      <Image
                        src={image.src}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 330px"
                        className={style.cardImageInner}
                      />
                    ) : (
                      <Users size={40} className={style.cardImageFallback} />
                    )}
                  </div>
                )}
                <h3 className={style.cardTitle}>{translation.name}</h3>
                <span className={style.cardFooter}>
                  {t('viewDetails')}
                  <ArrowRight
                    aria-hidden="true"
                    size={16}
                    className={style.cardArrow}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Management & Administration ───────────────────────── */}

      <h2 className={style.sectionTitle}>{t('managementTitle')}</h2>

      <div className={style.managementGrid}>
        <Link href="/about-us/structure/head" className={style.card}>
          <div className={style.cardIconWrapper} aria-hidden="true">
            <Crown aria-hidden="true" size={26} />
          </div>
          <h3 className={style.cardTitle}>{t('headCard')}</h3>
          <p className={style.cardDesc}>{t('headDesc')}</p>
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
