'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { FileText, ExternalLink, Briefcase } from 'lucide-react';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
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

  if (publications.length === 0 && projects.length === 0) return null;

  // If one of them is empty, default to the other one
  if (publications.length === 0 && activeTab === 'publications')
    setActiveTab('projects');
  if (projects.length === 0 && activeTab === 'projects')
    setActiveTab('publications');

  return (
    <section className={style.section}>
      <div className={style.header}>
        <h2 className={style.sectionTitle}>
          {t('publicationsTitle')}
          <span className={style.subtitle}>{t('publicationsSubtitle')}</span>
        </h2>
      </div>

      <div className={style.tabs}>
        {publications.length > 0 && (
          <button
            className={clsx(style.tab, {
              [style.active]: activeTab === 'publications',
            })}
            onClick={() => setActiveTab('publications')}
          >
            <FileText size={18} />
            {t('publicationsTab')}
          </button>
        )}
        {projects.length > 0 && (
          <button
            className={clsx(style.tab, {
              [style.active]: activeTab === 'projects',
            })}
            onClick={() => setActiveTab('projects')}
          >
            <Briefcase size={18} />
            {t('projectsTab')}
          </button>
        )}
      </div>

      <div className={style.content}>
        {activeTab === 'publications' && (
          <div className={style.list}>
            {publications.map((pub) => {
              const { translation } = resolveTranslation(
                pub.translations,
                locale
              );
              if (!translation) return null;
              return (
                <div key={pub.id} className={style.item}>
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
                        DOI <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className={style.list}>
            {projects.map((proj) => {
              const { translation } = resolveTranslation(
                proj.translations,
                locale
              );
              if (!translation) return null;
              return (
                <div key={proj.id} className={style.item}>
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
