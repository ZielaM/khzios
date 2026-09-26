import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTeamBySlug } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import BackLink from '@/components/BackLink';
import { permanentRedirect } from '@/i18n/routing';
import { teamHref, teamSlugFor } from '@/lib/team-routes';
import style from './page.module.scss';
import { Metadata } from 'next';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';

// Components
import FullTeamPage from '@/components/FullTeamPage';
import ExternalTeamPage from '@/components/ExternalTeamPage';
import { renderOnFirstRequest } from '@/lib/static-params';
import { pageMetadata } from '@/lib/seo';
import { excerpt, stripHtml } from '@/lib/content-utils';
import { setPageLocale } from '@/i18n/page-locale';

// ISR every 7 days
export const revalidate = 604800;

export const generateStaticParams = renderOnFirstRequest;

interface Props {
  params: Promise<{ locale: string; team: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, team: teamSlug } = await params;
  setPageLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) return {};

  const { translation } = resolveTranslation(team.translations, locale);
  const name = translation?.name ?? team.slug;
  return pageMetadata({
    locale,
    href: (l) => teamHref(team, l),
    title: name,
    description:
      excerpt(stripHtml(translation?.researchDescription ?? ''), 155) ||
      undefined,
    image: getSectionImage(IMAGE_SECTIONS.team(team.slug), locale, name),
  });
}

export default async function TeamPage({ params }: Props) {
  const { locale, team: teamSlug } = await params;
  setPageLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) notFound();

  // A slug from another language (e.g. after switching languages) or the
  // canonical slug leads to this language's address
  if (teamSlug !== teamSlugFor(team, locale)) {
    permanentRedirect({ href: teamHref(team, locale), locale });
  }

  const t = await getTranslations('TeamPage');
  const { translation } = resolveTranslation(team.translations, locale);
  const image = getSectionImage(
    IMAGE_SECTIONS.team(team.slug),
    locale,
    translation?.name
  );

  return (
    <div className={style.page}>
      <BackLink href="/about-us/structure">{t('backToStructure')}</BackLink>

      {team.type === 'EXTERNAL' ? (
        <ExternalTeamPage team={team} locale={locale} image={image} />
      ) : (
        <FullTeamPage team={team} locale={locale} image={image} />
      )}
    </div>
  );
}
