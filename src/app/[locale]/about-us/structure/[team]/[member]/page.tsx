import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getMemberBySlug, getAllMemberSlugs } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import { Link, routing } from '@/i18n/routing';
import { Mail, Phone, ExternalLink, Users, User } from 'lucide-react';
import BackLink from '@/components/BackLink';
import Image from 'next/image';
import OrcidIcon from '@/components/OrcidIcon';
import style from './page.module.scss';
import AnimateOnce from '@/components/AnimateOnce';
import { Metadata } from 'next';

// ISR every 7 days
export const revalidate = 604800;

export async function generateStaticParams() {
  const members = await getAllMemberSlugs();

  return routing.locales.flatMap((locale) =>
    members
      .filter((m) => m.profileSlug)
      .map((m) => ({
        locale,
        team: m.team.slug,
        member: m.profileSlug!,
      }))
  );
}

interface Props {
  params: Promise<{ locale: string; team: string; member: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, member: memberSlug } = await params;
  setRequestLocale(locale);

  const member = await getMemberBySlug(memberSlug);
  if (!member) return {};

  const { translation } = resolveTranslation(member.translations, locale);

  const titlePrefix = translation?.title ? `${translation.title} ` : '';
  const title = `${titlePrefix}${member.name} | KHZIOS`;

  return { title };
}

export default async function MemberPage({ params }: Props) {
  const { locale, team: teamSlug, member: memberSlug } = await params;
  setRequestLocale(locale);

  const member = await getMemberBySlug(memberSlug);
  if (!member || member.team.slug !== teamSlug) notFound();

  const t = await getTranslations('MemberProfile');
  const { translation: memberTranslation } = resolveTranslation(
    member.translations,
    locale
  );
  const { translation: teamTranslation } = resolveTranslation(
    member.team.translations,
    locale
  );

  const title = memberTranslation?.title ?? '';
  const teamName = teamTranslation?.name || member.team.slug;
  const hasContact = member.email || member.phone;

  return (
    <div className={style.page}>
      {/* Back Link */}
      <AnimateOnce>
        <BackLink
          href={
            `/about-us/structure/${teamSlug}` as `/about-us/structure/ruminants`
          }
        >
          {t('backToTeam')}
        </BackLink>
      </AnimateOnce>

      {/* Hero Card */}
      <AnimateOnce>
        <div className={style.heroCard}>
          <div className={style.avatarContainer}>
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                className={style.avatar}
                sizes="120px"
              />
            ) : (
              <div className={style.avatarFallback}>
                <User size={48} />
              </div>
            )}
          </div>
          <div className={style.heroInfo}>
            {title && <span className={style.heroTitle}>{title}</span>}
            <h1 className={style.heroName}>{member.name}</h1>
            <div className={style.teamBadge}>
              <Users size={16} />
              <span>{t('teamLabel')}:</span>
              <Link
                href={
                  `/about-us/structure/${teamSlug}` as `/about-us/structure/ruminants`
                }
                className={style.teamBadgeLink}
              >
                {teamName}
              </Link>
            </div>
          </div>
        </div>
      </AnimateOnce>

      {/* Info Cards Grid */}
      <AnimateOnce>
        <div className={style.infoGrid}>
          {/* Contact Card */}
          <div className={style.infoCard}>
            <div className={style.cardHeader}>
              <div className={style.cardIcon}>
                <Mail size={20} />
              </div>
              <h2 className={style.cardTitle}>{t('contactTitle')}</h2>
            </div>

            {hasContact ? (
              <ul className={style.contactList}>
                {member.email && (
                  <li className={style.contactItem}>
                    <div className={style.contactIconWrapper}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className={style.contactLabel}>
                        {t('emailLabel')}
                      </div>
                      <div className={style.contactValue}>
                        <a
                          href={`mailto:${member.email}`}
                          className={style.contactLink}
                        >
                          {member.email}
                        </a>
                      </div>
                    </div>
                  </li>
                )}
                {member.phone && (
                  <li className={style.contactItem}>
                    <div className={style.contactIconWrapper}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className={style.contactLabel}>
                        {t('phoneLabel')}
                      </div>
                      <div className={style.contactValue}>
                        <a
                          href={`tel:${member.phone.replace(/\s/g, '')}`}
                          className={style.contactLink}
                        >
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            ) : (
              <p className={style.noData}>{t('noContact')}</p>
            )}
          </div>

          {/* ORCID Card */}
          {member.orcid && (
            <div className={style.infoCard}>
              <div className={style.cardHeader}>
                <div className={style.cardIcon}>
                  <OrcidIcon className={style.orcidLogo} />
                </div>
                <h2 className={style.cardTitle}>{t('orcidTitle')}</h2>
              </div>

              <div className={style.orcidContent}>
                <p className={style.orcidDesc}>{t('orcidDesc')}</p>
                <div className={style.orcidId}>
                  <OrcidIcon className={style.orcidLogo} />
                  <span>{member.orcid}</span>
                </div>
                <a
                  href={`https://orcid.org/${member.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={style.orcidLink}
                >
                  {t('viewOrcid')} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}
        </div>
      </AnimateOnce>
    </div>
  );
}
