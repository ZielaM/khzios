import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Metadata } from 'next';
import AnimateOnce from '@/components/AnimateOnce';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import { getEmployeesWithConsultations } from '@/lib/student-queries';
import { resolveTranslation } from '@/lib/translations';

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

  return { title: `${t('title')} | KHZIOS` };
}

export default async function ForStudentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('StudentsPage');
  const employees = await getEmployeesWithConsultations();

  const tStruct = await getTranslations('StructurePage');

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
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
                        {employee.consultations.map((c) => {
                          const { translation: cTr } = resolveTranslation(
                            c.translations,
                            locale
                          );
                          return (
                            <div key={c.id} className={style.consultationBlock}>
                              {cTr?.day}
                            </div>
                          );
                        })}
                      </td>
                      <td data-label={t('consultationTime')}>
                        {employee.consultations.map((c) => {
                          const { translation: cTr } = resolveTranslation(
                            c.translations,
                            locale
                          );
                          return (
                            <div key={c.id} className={style.consultationBlock}>
                              {cTr?.time}
                            </div>
                          );
                        })}
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
    </div>
  );
}
