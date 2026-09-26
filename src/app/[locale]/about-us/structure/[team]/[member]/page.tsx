import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getMemberBySlug, getTeamBySlug } from '@/lib/team-queries';
import { memberHref, teamHref, teamSlugFor } from '@/lib/team-routes';
import { resolveTranslation } from '@/lib/translations';
import { Link, permanentRedirect } from '@/i18n/routing';
import { Mail, ExternalLink, Users } from 'lucide-react';
import BackLink from '@/components/BackLink';
import OrcidIcon from '@/components/OrcidIcon';
import {
  ContactDetails,
  InfoCard,
  InfoGrid,
  ProfileHero,
} from '@/components/Profile';
import style from './page.module.scss';
import AnimateOnce from '@/components/AnimateOnce';
import { Metadata } from 'next';
import { renderOnFirstRequest } from '@/lib/static-params';
import { pageMetadata, toAbsoluteUrl } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

// ISR every 7 days
export const revalidate = 604800;

export const generateStaticParams = renderOnFirstRequest;

interface Props {
  params: Promise<{ locale: string; team: string; member: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, team: teamSlug, member: memberSlug } = await params;
  setRequestLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  const member = team && (await getMemberBySlug(memberSlug, team.id));
  if (!team || !member) return {};

  const t = await getTranslations('MemberProfile');
  const { translation } = resolveTranslation(
    member.employee.translations,
    locale
  );
  const { translation: teamTranslation } = resolveTranslation(
    team.translations,
    locale
  );
  const name = [
    translation?.academicTitle,
    member.employee.firstName,
    member.employee.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return pageMetadata({
    locale,
    href: (l) => memberHref(team, l, memberSlug),
    title: name,
    description: t('metaDescription', {
      name,
      team: teamTranslation?.name ?? team.slug,
    }),
    image: member.employee.photoUrl
      ? { src: member.employee.photoUrl, alt: name }
      : null,
  });
}

export default async function MemberPage({ params }: Props) {
  const { locale, team: teamSlug, member: memberSlug } = await params;
  setRequestLocale(locale);

  const team = await getTeamBySlug(teamSlug);
  if (!team) notFound();
  if (teamSlug !== teamSlugFor(team, locale)) {
    permanentRedirect({ href: memberHref(team, locale, memberSlug), locale });
  }

  const member = await getMemberBySlug(memberSlug, team.id);
  if (!member) notFound();

  const t = await getTranslations('MemberProfile');
  const { translation: memberTranslation } = resolveTranslation(
    member.employee.translations,
    locale
  );
  const { translation: teamTranslation } = resolveTranslation(
    member.team.translations,
    locale
  );

  const title = memberTranslation?.academicTitle ?? '';
  const teamName = teamTranslation?.name || member.team.slug;

  const fullName = `${member.employee.firstName} ${member.employee.lastName}`;
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    ...(title && { honorificPrefix: title }),
    ...(member.employee.email && { email: member.employee.email }),
    ...(member.employee.phone && { telephone: member.employee.phone }),
    ...(member.employee.photoUrl && {
      image: toAbsoluteUrl(member.employee.photoUrl),
    }),
    ...(member.employee.orcid && {
      sameAs: [`https://orcid.org/${member.employee.orcid}`],
    }),
    worksFor: { '@type': 'Organization', name: teamName },
  };

  return (
    <div className={style.page}>
      <JsonLd data={personJsonLd} />
      {/* Back Link */}
      <AnimateOnce>
        <BackLink href={teamHref(team, locale)}>{t('backToTeam')}</BackLink>
      </AnimateOnce>

      <div className={style.profile}>
        <AnimateOnce>
          <ProfileHero
            name={fullName}
            title={title}
            photoUrl={member.employee.photoUrl}
          >
            <div className={style.teamBadge}>
              <Users aria-hidden="true" size={16} />
              <span>{t('teamLabel')}:</span>
              <Link
                href={teamHref(team, locale)}
                className={style.teamBadgeLink}
              >
                {teamName}
              </Link>
            </div>
          </ProfileHero>
        </AnimateOnce>

        <AnimateOnce>
          <InfoGrid>
            <InfoCard icon={<Mail size={20} />} title={t('contactTitle')}>
              <ContactDetails
                email={member.employee.email}
                phone={member.employee.phone}
              />
            </InfoCard>

            {member.employee.orcid && (
              <InfoCard
                icon={<OrcidIcon className={style.orcidLogo} />}
                title={t('orcidTitle')}
              >
                <div className={style.orcidContent}>
                  <p className={style.orcidDesc}>{t('orcidDesc')}</p>
                  <div className={style.orcidId}>
                    <OrcidIcon className={style.orcidLogo} />
                    <span>{member.employee.orcid}</span>
                  </div>
                  <a
                    href={`https://orcid.org/${member.employee.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={style.orcidLink}
                  >
                    {t('viewOrcid')}{' '}
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                </div>
              </InfoCard>
            )}
          </InfoGrid>
        </AnimateOnce>
      </div>
    </div>
  );
}
