import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/admin/session';
import {
  createUser,
  resetUserPassword,
  resetUserTwoFactor,
  updateUser,
} from '../../_actions/users';
import ActionForm from '../../_components/ActionForm';
import { Field } from '../../_components/fields';
import formStyle from '../../_components/forms.module.scss';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Użytkownicy · Panel KHZiOS' };

const roleSelect = (role = 'EDITOR') => (
  <label className={formStyle.field}>
    <span>Rola</span>
    <select name="role" defaultValue={role}>
      <option value="EDITOR">Redaktor (treści)</option>
      <option value="ADMIN">
        Administrator (treści, ustawienia, konta, dziennik)
      </option>
    </select>
  </label>
);

export default async function UsersPage() {
  const me = await requireUser('ADMIN');
  const users = await prisma.adminUser.findMany({
    orderBy: [{ disabled: 'asc' }, { login: 'asc' }],
  });

  return (
    <div className={style.page}>
      <h1>Użytkownicy panelu</h1>

      <section className={style.card} aria-labelledby="new-user">
        <h2 id="new-user">Nowe konto</h2>
        <p className={style.muted}>
          Panel wygeneruje hasło tymczasowe do przekazania osobiście. Przy
          pierwszym logowaniu trzeba je zmienić i włączyć logowanie
          dwuskładnikowe.
        </p>
        <ActionForm action={createUser} submitLabel="Utwórz konto">
          <div className={formStyle.row}>
            <Field
              label="Login"
              name="login"
              maxLength={50}
              required
              autoCapitalize="none"
            />
            <Field
              label="Imię i nazwisko"
              name="name"
              maxLength={100}
              required
            />
            {roleSelect()}
          </div>
        </ActionForm>
      </section>

      {users.map((user) => (
        <details key={user.id} className={style.card}>
          <summary>
            <strong>{user.name}</strong> ({user.login}) ·{' '}
            {user.role === 'ADMIN' ? 'administrator' : 'redaktor'}
            {user.disabled && <span className={style.badge}> zablokowane</span>}
            {!user.totpSecret && <span className={style.badge}> bez 2FA</span>}
            {user.id === me.id && <span className={style.badge}> to Ty</span>}
          </summary>
          <p className={style.muted}>
            Ostatnie logowanie:{' '}
            {user.lastLoginAt
              ? user.lastLoginAt.toLocaleString('pl-PL', {
                  timeZone: 'Europe/Warsaw',
                })
              : 'nigdy'}
          </p>
          <ActionForm action={updateUser} submitLabel="Zapisz">
            <input type="hidden" name="id" value={user.id} />
            <div className={formStyle.row}>
              <Field
                label="Imię i nazwisko"
                name="name"
                defaultValue={user.name}
                maxLength={100}
                required
              />
              {roleSelect(user.role)}
            </div>
            <label className={formStyle.checkboxField}>
              <input
                type="checkbox"
                name="disabled"
                defaultChecked={user.disabled}
              />{' '}
              Zablokowane (nie może się zalogować)
            </label>
          </ActionForm>
          <div className={formStyle.row}>
            <ActionForm
              action={resetUserPassword}
              submitLabel="Nadaj nowe hasło tymczasowe"
            >
              <input type="hidden" name="id" value={user.id} />
            </ActionForm>
            <ActionForm
              action={resetUserTwoFactor}
              submitLabel="Zresetuj logowanie dwuskładnikowe"
            >
              <input type="hidden" name="id" value={user.id} />
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
