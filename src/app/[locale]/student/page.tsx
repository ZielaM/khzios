import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import AnimateOnce from '@/components/AnimateOnce';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import { getStudentDocuments } from '@/lib/student-queries';
import { resolveTranslation } from '@/lib/translations';
import StudentSchedule from '@/components/StudentSchedule';
import PageBanner from '@/components/PageBanner';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import { renderOnFirstRequest } from '@/lib/static-params';
import { pageMetadata } from '@/lib/seo';

// Documents and the banner change rarely; announcements and consultations are
// fetched by <StudentSchedule> on every visit instead.
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = renderOnFirstRequest;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('StudentsPage');
  return pageMetadata({
    locale,
    href: '/student',
    title: t('title'),
    description: t('metaDescription'),
    image: getSectionImage(IMAGE_SECTIONS.student, locale, t('title')),
  });
}

export default async function ForStudentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('StudentsPage');
  const documents = await getStudentDocuments();

  const tStruct = await getTranslations('StructurePage');
  const bannerImage = getSectionImage(
    IMAGE_SECTIONS.student,
    locale,
    t('title')
  );

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
      </AnimateOnce>

      <h1 className={style.pageTitle}>{t('title')}</h1>

      {bannerImage && (
        <AnimateOnce>
          <PageBanner image={bannerImage} className={style.banner} preload />
        </AnimateOnce>
      )}

      <StudentSchedule locale={locale} />

      <AnimateOnce>
        <h2 className={style.title}>{t('documentsTitle')}</h2>
      </AnimateOnce>

      <AnimateOnce>
        <div className={style.tableContainer}>
          {documents.length === 0 ? (
            <p>{t('noDocuments')}</p>
          ) : (
            <table className={style.table} id="documents-table">
              <thead>
                <tr>
                  <th>{t('subjectName')}</th>
                  <th>{t('statute')}</th>
                  <th>{t('syllabus')}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const { translation } = resolveTranslation(
                    doc.translations,
                    locale
                  );

                  const subjectName = translation?.subjectName ?? doc.slug;

                  return (
                    <tr key={doc.id}>
                      <td
                        className={style.subjectName}
                        data-label={t('subjectName')}
                      >
                        {subjectName}
                      </td>
                      <td data-label={t('statute')}>
                        <a
                          href={doc.statutePath}
                          download
                          className={style.downloadLink}
                          aria-label={`${t('statute')} – ${subjectName}`}
                        >
                          <svg
                            className={style.downloadIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {t('download')}
                        </a>
                      </td>
                      <td data-label={t('syllabus')}>
                        <a
                          href={doc.syllabusPath}
                          download
                          className={style.downloadLink}
                          aria-label={`${t('syllabus')} – ${subjectName}`}
                        >
                          <svg
                            className={style.downloadIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {t('download')}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AnimateOnce>
    </div>
  );
}
