'use client';

import { useActionState } from 'react';
import { confirmEnrollment, type FormState } from '../_actions/auth';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

interface EnrollmentFormProps {
  qrCode: string;
  secret: string;
  continueHref: string;
}

/** First sign-in: add the account to an authenticator app, then save codes. */
export default function EnrollmentForm({
  qrCode,
  secret,
  continueHref,
}: EnrollmentFormProps) {
  const [state, action] = useActionState<FormState, FormData>(
    confirmEnrollment,
    {}
  );

  if (state.recoveryCodes) {
    return (
      <div className={style.form}>
        <p>
          Logowanie dwuskładnikowe jest włączone. Zapisz poniższe kody zapasowe
          w bezpiecznym miejscu. Każdy działa raz i pozwala się zalogować bez
          telefonu. Nie będą już pokazane ponownie.
        </p>
        <ul className={style.codes}>
          {state.recoveryCodes.map((code) => (
            <li key={code}>
              <code>{code}</code>
            </li>
          ))}
        </ul>
        {/* A full navigation, so the layout renders the signed-in panel */}
        <a href={continueHref} className={`${style.button} ${style.primary}`}>
          Zapisałem kody, przejdź do panelu
        </a>
      </div>
    );
  }

  return (
    <form action={action} className={style.form}>
      <ol className={style.steps}>
        <li>
          Zainstaluj aplikację uwierzytelniającą (np. Google Authenticator,
          Microsoft Authenticator lub Aegis).
        </li>
        <li>
          Zeskanuj kod QR albo wpisz klucz ręcznie.
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img
            src={qrCode}
            alt="Kod QR do dodania konta w aplikacji"
            width={200}
            height={200}
            className={style.qr}
          />
          <span className={style.secret}>
            Klucz: <code>{secret}</code>
          </span>
        </li>
        <li>Wpisz 6-cyfrowy kod, który pokazuje aplikacja.</li>
      </ol>
      <FormMessage error={state.error} />
      <label className={style.field}>
        <span>Kod z aplikacji</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </label>
      <SubmitButton pendingLabel="Sprawdzanie…">
        Włącz logowanie dwuskładnikowe
      </SubmitButton>
    </form>
  );
}
