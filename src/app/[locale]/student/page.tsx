import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Metadata } from 'next';
import AnimateOnce from '@/components/AnimateOnce';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import {
  getEmployeesWithConsultations,
  getStudentAnnouncements,
  getStudentDocuments,
} from '@/lib/student-queries';
import { resolveTranslation } from '@/lib/translations';
import StudentAnnouncements from '@/components/StudentAnnouncements';
import PageBanner from '@/components/PageBanner';
import { getSectionImage, IMAGE_SECTIONS } from '@/lib/site-images';
import { buildShareMetadata } from '@/lib/seo';

// ISR every 7 days
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('StudentsPage');
  const title = `${t('title')} | KHZIOS`;
  const image = getSectionImage(IMAGE_SECTIONS.student, locale, t('title'));

  return { title, ...buildShareMetadata(title, image) };
}

export default async function ForStudentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('StudentsPage');
  const employees = await getEmployeesWithConsultations();
  const announcements = await getStudentAnnouncements();
  const documents = await getStudentDocuments();

  const tStruct = await getTranslations('StructurePage');
  const bannerImage = getSectionImage(
    IMAGE_SECTIONS.student,
    locale,
    t('title')
  );

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
      </AnimateOnce>

      {bannerImage && (
        <AnimateOnce>
          <PageBanner image={bannerImage} className={style.banner} preload />
        </AnimateOnce>
      )}

      <AnimateOnce>
        <StudentAnnouncements announcements={announcements} locale={locale} />
      </AnimateOnce>

      <AnimateOnce>
        <h1 className={style.title}>{t('consultationsTitle')}</h1>
      </AnimateOnce>

      <AnimateOnce>
        <div className={style.tableContainer}>
          {employees.length === 0 ? (
            <p>{t('noConsultations')}</p>
          ) : (
            <table className={style.table}>
              <thead>
                <tr>
                  <th>{t('employeeName')}</th>
                  <th>{t('consultationDay')}</th>
                  <th>{t('consultationTime')}</th>
                  <th>{t('consultationRoom')}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const { translation } = resolveTranslation(
                    employee.translations,
                    locale
                  );

                  const prefix = translation?.academicTitle
                    ? `${translation.academicTitle} `
                    : '';
                  const fullName = `${prefix}${employee.firstName} ${employee.lastName}`;

                  return (
                    <tr key={employee.id}>
                      <td
                        className={style.employeeName}
                        data-label={t('employeeName')}
                      >
                        {fullName}
                      </td>
                      <td data-label={t('consultationDay')}>
                        {employee.consultations.map((c) => (
                          <div key={c.id} className={style.consultationBlock}>
                            {dateFormatter.format(new Date(c.date))}
                          </div>
                        ))}
                      </td>
                      <td data-label={t('consultationTime')}>
                        {employee.consultations.map((c) => (
                          <div key={c.id} className={style.consultationBlock}>
                            {c.time}
                          </div>
                        ))}
                      </td>
                      <td data-label={t('consultationRoom')}>
                        {employee.consultations.map((c) => (
                          <div key={c.id} className={style.consultationBlock}>
                            {c.room || employee.officeLocation}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AnimateOnce>

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
