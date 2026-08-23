import { searchPublications } from '@/actions/search-publications';
import Pagination from '@/components/Pagination';
import style from './PublicationsListServer.module.scss';
import { SearchX, ExternalLink, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageCode } from '@/types/search-types';
import { resolveTranslation } from '@/lib/translations';
import { Link } from '@/i18n/routing';

interface PublicationsListServerProps {
  query?: string;
  locale: LanguageCode;
  page: number;
}

export default async function PublicationsListServer({
  query,
  locale,
  page,
}: PublicationsListServerProps) {
  const { data, totalPages } = await searchPublications({
    query,
    language: locale,
    page,
    sortBy: query ? 'relevance' : 'date', // Dynamic sorting
  });

  const t = await getTranslations('PublicationsPage');

  return (
    <>
      <div className={style.publicationsList}>
        {data.length === 0 ? (
          <div className={style.noResults}>
            <SearchX
              aria-hidden="true"
              className={style.noResultsIcon}
              size={48}
            />
            <p>{t('noResults')}</p>
          </div>
        ) : (
          <div className={style.listContainer}>
            {data.map((pub) => {
              const { translation } = resolveTranslation(
                pub.translations,
                locale
              );
              if (!translation) return null;

              const teamTranslation = pub.team
                ? resolveTranslation(pub.team.translations, locale).translation
                : null;

              return (
                <div key={pub.id} className={style.publicationItem}>
                  <div className={style.itemYear}>{pub.year}</div>
                  <div className={style.itemContent}>
                    <h3
                      className={style.itemTitle}
                      dangerouslySetInnerHTML={{ __html: translation.title }}
                    />
                    <div className={style.itemMeta}>
                      <span className={style.authors}>{pub.authors}</span>
                      <span className={style.journal}>{pub.journal}</span>
                    </div>

                    <div className={style.itemFooter}>
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

                      {pub.team && teamTranslation && (
                        <Link
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          href={`/about-us/structure/${pub.team.slug}` as any}
                          className={style.teamLink}
                        >
                          {teamTranslation.name}{' '}
                          <ArrowRight aria-hidden="true" size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </>
  );
}
