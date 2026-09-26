import type { Metadata } from 'next';
import { requireUser } from '@/lib/admin/session';
import {
  regenerateRecoveryCodes,
  signOutEverywhereElse,
} from '../../_actions/auth';
import ActionForm from '../../_components/ActionForm';
import ConfirmButton from '../../_components/ConfirmButton';
import { Field } from '../../_components/fields';
import FormMessage from '../../_components/FormMessage';
import PasswordForm from '../../_components/PasswordForm';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Moje konto · Panel KHZiOS' };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ signedOut?: string }>;
}) {
  const user = await requireUser();
  const { signedOut } = await searchParams;

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

      <section aria-labelledby="recovery-codes">
        <h2 id="recovery-codes">Nowe kody zapasowe</h2>
        <p className={style.muted}>
          Kody pozwalają zalogować się bez telefonu. Wygeneruj nowe, gdy kończą
          się stare albo gdy mogły trafić w niepowołane ręce.
        </p>
        <ActionForm
          action={regenerateRecoveryCodes}
          submitLabel="Wygeneruj nowe kody"
        >
          <Field
            label="Obecne hasło"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </ActionForm>
      </section>

      <section aria-labelledby="sessions">
        <h2 id="sessions">Inne urządzenia</h2>
        {signedOut && (
          <FormMessage message="Wylogowano ze wszystkich pozostałych urządzeń." />
        )}
        <p className={style.muted}>
          Przydatne, jeśli zapomniałeś(-aś) wylogować się na cudzym komputerze.
        </p>
        <form action={signOutEverywhereElse}>
          <ConfirmButton
            variant="secondary"
            message="Wylogować wszystkie pozostałe urządzenia?"
          >
            Wyloguj ze wszystkich pozostałych urządzeń
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
