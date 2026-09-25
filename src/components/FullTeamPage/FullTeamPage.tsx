import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import TeamHero from '@/components/TeamHero';
import TeamMembers from '@/components/TeamMembers';
import TeamResearch from '@/components/TeamResearch';
import TeamPublications from '@/components/TeamPublications';
import TeamTeaching from '@/components/TeamTeaching';
import type { SiteImage } from '@/lib/site-images';
import style from './FullTeamPage.module.scss';

interface FullTeamPageProps {
  team: TeamWithRelations;
  locale: string;
  image?: SiteImage | null;
}

export default function FullTeamPage({
  team,
  locale,
  image,
}: FullTeamPageProps) {
  const { translation: teamTranslation } = resolveTranslation(
    team.translations,
    locale
  );

  return (
    <div className={style.fullTeam}>
      <TeamHero name={teamTranslation?.name || team.slug} image={image} />

      <div className={style.contentGrid}>
        <TeamMembers members={team.members} locale={locale} team={team} />

        <TeamResearch content={teamTranslation?.researchDescription} />

        <TeamPublications
          publications={team.publications}
          projects={team.projects}
          locale={locale}
        />

        <TeamTeaching
          content={teamTranslation?.teachingDescription}
          courses={team.courses}
          locale={locale}
        />
      </div>
    </div>
  );
}
