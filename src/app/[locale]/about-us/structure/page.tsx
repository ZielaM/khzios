import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, routing } from '@/i18n/routing';
import { Metadata } from 'next';
import { ArrowRight, Crown, Briefcase } from 'lucide-react';
import BackLink from '@/components/BackLink';
import AnimateOnce from '@/components/AnimateOnce';
import SpotlightGrid from '@/components/SpotlightGrid';
import { getAllTeams } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import style from './page.module.scss';

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

  const t = await getTranslations('StructurePage');
  return { title: `${t('title')} | KHZIOS` };
}

export default async function StructurePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('StructurePage');
  const teams = await getAllTeams();

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/about-us">{t('backToAboutUs')}</BackLink>
      </AnimateOnce>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <AnimateOnce>
        <section className={style.hero}>
          <h1 className={style.heroTitle}>{t('title')}</h1>
          <p className={style.heroDesc}>{t('description')}</p>
        </section>
      </AnimateOnce>

      {/* ── Management & Administration ───────────────────────── */}
      <AnimateOnce>
        <h2 className={style.sectionTitle}>{t('managementTitle')}</h2>
      </AnimateOnce>

      <AnimateOnce>
        <SpotlightGrid className={style.managementGrid}>
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
        </SpotlightGrid>
      </AnimateOnce>

      {/* ── Teams ─────────────────────────────────────────────── */}
      <AnimateOnce>
        <h2 className={style.sectionTitle}>{t('teamsTitle')}</h2>
      </AnimateOnce>

      <div className={style.teamsSection}>
        <AnimateOnce>
          <SpotlightGrid className={style.teamsGrid}>

            {teams.map((team) => {
              const { translation } = resolveTranslation(
                team.translations,
                locale
              );
              if (!translation) return null;

              // Build the href using the team slug as a typed route
              const href =
                `/about-us/structure/${team.slug}` as `/about-us/structure/ruminants`;

              return (
                <Link key={team.id} href={href} className={style.card}>
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
          </SpotlightGrid>
        </AnimateOnce>
      </div>
    </div>
  );
}
