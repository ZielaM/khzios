import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import AnimateOnce from '@/components/AnimateOnce';
import TeamHero from '@/components/TeamHero';
import TeamMembers from '@/components/TeamMembers';
import TeamResearch from '@/components/TeamResearch';
import TeamPublications from '@/components/TeamPublications';
import TeamTeaching from '@/components/TeamTeaching';
import style from './FullTeamPage.module.scss';

interface FullTeamPageProps {
  team: TeamWithRelations;
  locale: string;
}

export default function FullTeamPage({ team, locale }: FullTeamPageProps) {
  const { translation: teamTranslation } = resolveTranslation(
    team.translations,
    locale
  );

  return (
    <AnimateOnce>
      <div className={style.fullTeam}>
        <TeamHero name={teamTranslation?.name || team.slug} />

        <div className={style.contentGrid}>
          <TeamMembers
            members={team.members}
            locale={locale}
            teamSlug={team.slug}
          />

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
    </AnimateOnce>
  );
}
