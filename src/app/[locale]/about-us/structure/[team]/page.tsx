import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTeamBySlug } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import AnimateOnce from '@/components/AnimateOnce';
import { Metadata } from 'next';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import { buildShareMetadata } from '@/lib/seo';

// Components
import FullTeamPage from '@/components/FullTeamPage';
import ExternalTeamPage from '@/components/ExternalTeamPage';
import { renderOnFirstRequest } from '@/lib/static-params';

// ISR every 7 days
export const revalidate = 604800;

export const generateStaticParams = renderOnFirstRequest;

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
  const image = getSectionImage(
    IMAGE_SECTIONS.team(team.slug),
    locale,
    translation?.name
  );

  return { title, ...buildShareMetadata(title, image) };
}

export default async function TeamPage({ params }: Props) {
  const { locale, team: teamSlug } = await params;
  setRequestLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) notFound();

  const t = await getTranslations('TeamPage');
  const { translation } = resolveTranslation(team.translations, locale);
  const image = getSectionImage(
    IMAGE_SECTIONS.team(team.slug),
    locale,
    translation?.name
  );

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/about-us/structure">{t('backToStructure')}</BackLink>
      </AnimateOnce>

      {team.type === 'EXTERNAL' ? (
        <AnimateOnce>
          <ExternalTeamPage team={team} locale={locale} image={image} />
        </AnimateOnce>
      ) : (
        <FullTeamPage team={team} locale={locale} image={image} />
      )}
    </div>
  );
}
