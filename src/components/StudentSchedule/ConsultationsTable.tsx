import { useTranslations } from 'next-intl';
import { resolveTranslation } from '@/lib/translations';
import { formatDate } from '@/lib/dates';
import type { EmployeeConsultationsDto } from '@/lib/student-schedule';
import style from './ConsultationsTable.module.scss';

interface ConsultationsTableProps {
  employees: EmployeeConsultationsDto[];
  locale: string;
}

export default function ConsultationsTable({
  employees,
  locale,
}: ConsultationsTableProps) {
  const t = useTranslations('StudentsPage');

  if (employees.length === 0) {
    return <p className={style.empty}>{t('noConsultations')}</p>;
  }

  return (
    <div className={style.tableContainer}>
      <table className={style.table}>
        <thead>
          <tr>
            <th scope="col">{t('employeeName')}</th>
            <th scope="col">{t('consultationDay')}</th>
            <th scope="col">{t('consultationTime')}</th>
            <th scope="col">{t('consultationRoom')}</th>
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

            return (
              <tr key={employee.id}>
                <th
                  scope="row"
                  className={style.employeeName}
                  data-label={t('employeeName')}
                >
                  {`${prefix}${employee.firstName} ${employee.lastName}`}
                </th>
                <td data-label={t('consultationDay')}>
                  {employee.consultations.map((c) => (
                    <div key={c.id} className={style.slot}>
                      <time dateTime={c.date}>
                        {formatDate(c.date, locale)}
                      </time>
                    </div>
                  ))}
                </td>
                <td data-label={t('consultationTime')}>
                  {employee.consultations.map((c) => (
                    <div key={c.id} className={style.slot}>
                      {c.time}
                    </div>
                  ))}
                </td>
                <td data-label={t('consultationRoom')}>
                  {employee.consultations.map((c) => (
                    <div key={c.id} className={style.slot}>
                      {c.room || employee.officeLocation}
                    </div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
