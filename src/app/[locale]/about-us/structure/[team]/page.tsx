import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTeamBySlug, getAllTeamSlugs } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import { Link, routing } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';
import style from './page.module.scss';
import AnimateOnce from '@/components/AnimateOnce';
import { Metadata } from 'next';

// Components
import FullTeamPage from '@/components/FullTeamPage';
import ExternalTeamPage from '@/components/ExternalTeamPage';

// ISR every 7 days
export const revalidate = 604800;

export async function generateStaticParams() {
  const teams = await getAllTeamSlugs();

  return routing.locales.flatMap((locale) =>
    teams.map((team) => ({
      locale,
      team: team.slug,
    }))
  );
}

interface Props {
  params: Promise<{ locale: string; team: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, team: teamSlug } = await params;
  setRequestLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) return {};

  const { translation } = resolveTranslation(team.translations, locale);
  const title = translation?.name ? `${translation.name} | KHZIOS` : 'KHZIOS';

  return { title };
}

export default async function TeamPage({ params }: Props) {
  const { locale, team: teamSlug } = await params;
  setRequestLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) notFound();

  const t = await getTranslations('TeamPage');

  return (
    <div className={style.page}>
      <AnimateOnce>
        <Link href="/about-us/structure" className={style.backLink}>
          <ChevronLeft size={20} />
          {t('backToStructure')}
        </Link>
      </AnimateOnce>

      {team.type === 'EXTERNAL' ? (
        <AnimateOnce>
          <ExternalTeamPage team={team} locale={locale} />
        </AnimateOnce>
      ) : (
        <FullTeamPage team={team} locale={locale} />
      )}
    </div>
  );
}
