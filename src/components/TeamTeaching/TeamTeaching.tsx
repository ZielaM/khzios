import { useTranslations } from 'next-intl';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import style from './TeamTeaching.module.scss';
import DOMPurify from 'isomorphic-dompurify';

interface TeamTeachingProps {
  content?: string | null;
  courses: TeamWithRelations['courses'];
  locale: string;
}

export default function TeamTeaching({
  content,
  courses,
  locale,
}: TeamTeachingProps) {
  const t = useTranslations('TeamPage');

  if (!content && courses.length === 0) return null;

  return (
    <section className={style.section}>
      <h2 className={style.sectionTitle}>{t('teachingTitle')}</h2>

      {content && (
        <div
          className={style.content}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      )}

      {courses.length > 0 && (
        <div className={style.tableContainer}>
          <table className={style.table}>
            <thead>
              <tr>
                <th>{t('courseNameHeader')}</th>
                <th>{t('programHeader')}</th>
                <th>{t('coordinatorHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const { translation } = resolveTranslation(
                  course.translations,
                  locale
                );
                if (!translation) return null;

                return (
                  <tr key={course.id}>
                    <td
                      className={style.courseName}
                      data-label={t('courseNameHeader')}
                    >
                      {translation.name}
                    </td>
                    <td data-label={t('programHeader')}>
                      {translation.program}
                    </td>
                    <td data-label={t('coordinatorHeader')}>
                      {translation.coordinator}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
