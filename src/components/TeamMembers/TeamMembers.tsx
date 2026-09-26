import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import style from './TeamMembers.module.scss';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import { memberHref } from '@/lib/team-routes';

interface TeamMembersProps {
  members: TeamWithRelations['members'];
  locale: string;
  team: TeamSlugs;
}

type TeamSlugs = Pick<TeamWithRelations, 'slug' | 'translations'>;

export default function TeamMembers({
  members,
  locale,
  team,
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
                team={team}
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
                team={team}
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
  team,
}: {
  member: TeamWithRelations['members'][0];
  locale: string;
  team: TeamSlugs;
}) {
  const { translation } = resolveTranslation(
    member.employee.translations,
    locale
  );
  const fullName = `${member.employee.firstName} ${member.employee.lastName}`;

  return (
    <div className={style.card}>
      <div className={style.avatarContainer}>
        {member.employee.photoUrl ? (
          // The name next to the photo is the link text; the photo adds nothing
          <Image
            src={member.employee.photoUrl}
            alt=""
            fill
            className={style.avatar}
            sizes="64px"
          />
        ) : (
          <div className={style.avatarFallback}>
            <User aria-hidden="true" size={28} />
          </div>
        )}
      </div>
      <div className={style.info}>
        {translation?.academicTitle && (
          <span className={style.title}>{translation.academicTitle}</span>
        )}
        {member.employee.profileSlug ? (
          <Link
            href={memberHref(team, locale, member.employee.profileSlug)}
            className={style.name}
          >
            {fullName}
          </Link>
        ) : (
          <span className={style.name}>{fullName}</span>
        )}
      </div>
    </div>
  );
}
