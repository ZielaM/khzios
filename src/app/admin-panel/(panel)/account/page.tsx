import type { Metadata } from 'next';
import { requireUser } from '@/lib/admin/session';
import PasswordForm from '../../_components/PasswordForm';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Moje konto · Panel KHZiOS' };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className={style.page}>
      <h1>Moje konto</h1>
      <dl className={style.facts}>
        <dt>Login</dt>
        <dd>{user.login}</dd>
        <dt>Rola</dt>
        <dd>{user.role === 'ADMIN' ? 'Administrator' : 'Redaktor'}</dd>
        <dt>Kody zapasowe</dt>
        <dd>{user.recoveryCodes.length} z 10 niewykorzystanych</dd>
      </dl>

      <section aria-labelledby="change-password">
        <h2 id="change-password">Zmiana hasła</h2>
        <p className={style.muted}>
          Po zmianie hasła pozostałe urządzenia zostaną wylogowane.
        </p>
        <PasswordForm />
      </section>
    </div>
  );
}
