import type { Metadata } from 'next';
import { requireUser } from '@/lib/admin/session';
import { saveTeam } from '../../../_actions/teams';
import ActionForm from '../../../_components/ActionForm';
import TeamFields from '../../../_components/TeamFields';
import style from '../../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Nowy zespół · Panel KHZiOS' };

export default async function NewTeamPage() {
  await requireUser();
  return (
    <div className={style.page}>
      <h1>Nowy zespół</h1>
      <p className={style.muted}>
        Osoby, projekty i przedmioty dodasz po utworzeniu zespołu.
      </p>
      <ActionForm action={saveTeam} submitLabel="Utwórz" wide>
        <TeamFields />
      </ActionForm>
    </div>
  );
}
