import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import AnimateOnce from '@/components/AnimateOnce/AnimateOnce';
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
    <div className={style.fullTeam}>
      <AnimateOnce>
        <TeamHero name={teamTranslation?.name || team.slug} />
      </AnimateOnce>

      <div className={style.contentGrid}>
        <AnimateOnce>
          <TeamMembers members={team.members} locale={locale} />
        </AnimateOnce>

        <AnimateOnce>
          <TeamResearch content={teamTranslation?.researchDescription} />
        </AnimateOnce>

        <AnimateOnce>
          <TeamPublications
            publications={team.publications}
            projects={team.projects}
            locale={locale}
          />
        </AnimateOnce>

        <AnimateOnce>
          <TeamTeaching
            content={teamTranslation?.teachingDescription}
            courses={team.courses}
            locale={locale}
          />
        </AnimateOnce>
      </div>
    </div>
  );
}
