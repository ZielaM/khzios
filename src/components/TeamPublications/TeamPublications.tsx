import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import style from './TeamPublications.module.scss';

interface TeamPublicationsProps {
  publications: TeamWithRelations['publications'];
  projects: TeamWithRelations['projects'];
  locale: string;
}

const doiUrl = (doi: string) =>
  doi.startsWith('http') ? doi : `https://doi.org/${doi}`;

/** The team's recent publications and projects, as two plain sections. */
export default function TeamPublications({
  publications,
  projects,
  locale,
}: TeamPublicationsProps) {
  const t = useTranslations('TeamPage');
  const safePublications = Array.isArray(publications) ? publications : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <>
      {safePublications.length > 0 && (
        <section className={style.section} aria-labelledby="team-publications">
          <h2 id="team-publications" className={style.sectionTitle}>
            {t('publicationsTab')}{' '}
            <span className={style.subtitle}>{t('publicationsSubtitle')}</span>
          </h2>
          <ul className={style.list}>
            {safePublications.map((pub) => {
              const { translation } = resolveTranslation(
                pub.translations,
                locale
              );
              if (!translation) return null;
              return (
                <li key={pub.id} className={style.item}>
                  <span className={style.itemYear}>{pub.year}</span>
                  <div className={style.itemContent}>
                    <h3 className={style.itemTitle}>{translation.title}</h3>
                    <p className={style.itemMeta}>
                      <span className={style.authors}>{pub.authors}</span>
                      <span className={style.journal}>{pub.journal}</span>
                    </p>
                    {pub.doi && (
                      <a
                        href={doiUrl(pub.doi)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={style.doiLink}
                      >
                        DOI <ExternalLink aria-hidden="true" size={14} />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {safeProjects.length > 0 && (
        <section className={style.section} aria-labelledby="team-projects">
          <h2 id="team-projects" className={style.sectionTitle}>
            {t('projectsTab')}
          </h2>
          <ul className={style.list}>
            {safeProjects.map((proj) => {
              const { translation } = resolveTranslation(
                proj.translations,
                locale
              );
              if (!translation) return null;
              return (
                <li key={proj.id} className={style.item}>
                  <span className={style.itemYear}>{proj.years}</span>
                  <div className={style.itemContent}>
                    <h3 className={style.itemTitle}>{translation.title}</h3>
                    {translation.funder && (
                      <p className={style.itemMeta}>
                        <span className={style.funder}>
                          {t('funder')}: {translation.funder}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
