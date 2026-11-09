import { useTranslations } from 'next-intl';
import { resolveTranslation } from '@/lib/translations';
import { weekdayName } from '@/lib/weekdays';
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

  // One row per weekly slot, so a long note cannot misalign the columns
  const rows = employees.flatMap((employee) => {
    const { translation } = resolveTranslation(employee.translations, locale);
    const prefix = translation?.academicTitle
      ? `${translation.academicTitle} `
      : '';
    const name = `${prefix}${employee.firstName} ${employee.lastName}`;
    return employee.consultations.map((c) => ({
      ...c,
      name,
      room: c.room || employee.officeLocation,
      note: resolveTranslation(c.translations, locale).translation?.note,
    }));
  });
  const hasNotes = rows.some((r) => r.note);

  return (
    <div className={style.tableContainer}>
      <table className={style.table}>
        <thead>
          <tr>
            <th scope="col">{t('employeeName')}</th>
            <th scope="col">{t('consultationDay')}</th>
            <th scope="col">{t('consultationTime')}</th>
            <th scope="col">{t('consultationRoom')}</th>
            {hasNotes && <th scope="col">{t('consultationNote')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th
                scope="row"
                className={style.employeeName}
                data-label={t('employeeName')}
              >
                {r.name}
              </th>
              <td data-label={t('consultationDay')}>
                {weekdayName(r.weekday, locale)}
              </td>
              <td data-label={t('consultationTime')}>
                <time dateTime={r.startTime}>{r.startTime}</time>–
                <time dateTime={r.endTime}>{r.endTime}</time>
              </td>
              <td data-label={t('consultationRoom')}>{r.room}</td>
              {hasNotes && <td data-label={t('consultationNote')}>{r.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
