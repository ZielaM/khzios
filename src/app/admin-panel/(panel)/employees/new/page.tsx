import type { Metadata } from 'next';
import { requireUser } from '@/lib/admin/session';
import { saveEmployee } from '../../../_actions/people';
import ActionForm from '../../../_components/ActionForm';
import EmployeeFields from '../../../_components/EmployeeFields';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Nowy pracownik · Panel KHZiOS' };

export default async function NewEmployeePage() {
  await requireUser();
  return (
    <div className={style.page}>
      <h1>Nowy pracownik</h1>
      <p className={style.muted}>
        Do zespołu dodasz tę osobę na stronie zespołu.
      </p>
      <ActionForm action={saveEmployee} submitLabel="Utwórz" wide>
        <EmployeeFields />
      </ActionForm>
    </div>
  );
}
