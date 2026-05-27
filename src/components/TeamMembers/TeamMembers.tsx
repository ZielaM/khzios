import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { User, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import style from './TeamMembers.module.scss';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';

interface TeamMembersProps {
  members: TeamWithRelations['members'];
  locale: string;
  teamSlug: string;
}

export default function TeamMembers({
  members,
  locale,
  teamSlug,
}: TeamMembersProps) {
  const t = useTranslations('TeamPage');

  const academicStaff = members.filter((m) => m.category === 'ACADEMIC');
  const technicalStaff = members.filter((m) => m.category === 'TECHNICAL');

  if (members.length === 0) return null;

  return (
    <section className={style.section}>
      <h2 className={style.sectionTitle}>{t('membersTitle')}</h2>

      {academicStaff.length > 0 && (
        <div className={style.categoryBlock}>
          <h3 className={style.categoryTitle}>{t('academicStaff')}</h3>
          <div className={style.grid}>
            {academicStaff.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                locale={locale}
                teamSlug={teamSlug}
              />
            ))}
          </div>
        </div>
      )}

      {technicalStaff.length > 0 && (
        <div className={style.categoryBlock}>
          <h3 className={style.categoryTitle}>{t('technicalStaff')}</h3>
          <div className={style.grid}>
            {technicalStaff.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                locale={locale}
                teamSlug={teamSlug}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MemberCard({
  member,
  locale,
  teamSlug,
}: {
  member: TeamWithRelations['members'][0];
  locale: string;
  teamSlug: string;
}) {
  const t = useTranslations('TeamPage');
  const { translation } = resolveTranslation(member.translations, locale);

  const title = translation?.title ?? '';

  return (
    <div className={style.card}>
      <div className={style.avatarContainer}>
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.name}
            fill
            className={style.avatar}
            sizes="80px"
          />
        ) : (
          <div className={style.avatarFallback}>
            <User size={32} />
          </div>
        )}
      </div>
      <div className={style.info}>
        <div className={style.title}>{title}</div>
        <div className={style.name}>{member.name}</div>
        {member.profileSlug && (
          <Link
            href={{
              pathname: '/about-us/structure/[team]/[member]' as const,
              params: { team: teamSlug, member: member.profileSlug },
            }}
            className={style.profileLink}
          >
            {t('viewProfile')} <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
