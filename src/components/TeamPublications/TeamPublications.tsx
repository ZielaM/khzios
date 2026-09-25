'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { FileText, ExternalLink, Briefcase } from 'lucide-react';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import AnimateOnce from '@/components/AnimateOnce';
import style from './TeamPublications.module.scss';

interface TeamPublicationsProps {
  publications: TeamWithRelations['publications'];
  projects: TeamWithRelations['projects'];
  locale: string;
}

type Tab = 'publications' | 'projects';

export default function TeamPublications({
  publications,
  projects,
  locale,
}: TeamPublicationsProps) {
  const t = useTranslations('TeamPage');
  const [activeTab, setActiveTab] = useState<Tab>('publications');

  // Fallback do pustych tablic, by unikać crashy przy obiektach / stringach
  const safePublications = Array.isArray(publications) ? publications : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  if (safePublications.length === 0 && safeProjects.length === 0) return null;

  // If one of them is empty, default to the other one
  if (safePublications.length === 0 && activeTab === 'publications')
    setActiveTab('projects');
  if (safeProjects.length === 0 && activeTab === 'projects')
    setActiveTab('publications');

  const tabs: Tab[] = [
    ...(safePublications.length > 0 ? (['publications'] as const) : []),
    ...(safeProjects.length > 0 ? (['projects'] as const) : []),
  ];

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const index = tabs.indexOf(activeTab);
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActiveTab(next);
    document.getElementById(`team-tab-${next}`)?.focus();
  };

  return (
    <section className={style.section}>
      <div className={style.header}>
        <h2 className={style.sectionTitle}>
          {t('publicationsTitle')}
          <span className={style.subtitle}>{t('publicationsSubtitle')}</span>
        </h2>
      </div>

      <div
        className={style.tabs}
        role="tablist"
        aria-label={t('publicationsTitle')}
        onKeyDown={onTabKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`team-tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`team-panel-${tab}`}
            // Only the selected tab is in the Tab order; arrows move between tabs
            tabIndex={activeTab === tab ? 0 : -1}
            className={clsx(style.tab, { [style.active]: activeTab === tab })}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'publications' ? (
              <FileText aria-hidden="true" size={18} />
            ) : (
              <Briefcase aria-hidden="true" size={18} />
            )}
            {t(tab === 'publications' ? 'publicationsTab' : 'projectsTab')}
          </button>
        ))}
      </div>

      <div
        className={style.content}
        role="tabpanel"
        id={`team-panel-${activeTab}`}
        aria-labelledby={`team-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'publications' && (
          <div className={style.list}>
            {safePublications.map((pub) => {
              const { translation } = resolveTranslation(
                pub.translations,
                locale
              );
              if (!translation) return null;
              return (
                <AnimateOnce key={pub.id}>
                  <div className={style.item}>
                    <div className={style.itemYear}>{pub.year}</div>
                    <div className={style.itemContent}>
                      <h3 className={style.itemTitle}>{translation.title}</h3>
                      <div className={style.itemMeta}>
                        <span className={style.authors}>{pub.authors}</span>
                        <span className={style.journal}>{pub.journal}</span>
                      </div>
                      {pub.doi && (
                        <a
                          href={
                            pub.doi.startsWith('http')
                              ? pub.doi
                              : `https://doi.org/${pub.doi}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={style.doiLink}
                        >
                          DOI <ExternalLink aria-hidden="true" size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </AnimateOnce>
              );
            })}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className={style.list}>
            {safeProjects.map((proj) => {
              const { translation } = resolveTranslation(
                proj.translations,
                locale
              );
              if (!translation) return null;
              return (
                <AnimateOnce key={proj.id}>
                  <div className={style.item}>
                    <div className={style.itemYear}>{proj.years}</div>
                    <div className={style.itemContent}>
                      <h3 className={style.itemTitle}>{translation.title}</h3>
                      {translation.funder && (
                        <div className={style.itemMeta}>
                          <span className={style.funder}>
                            {t('funder')}: {translation.funder}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </AnimateOnce>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
