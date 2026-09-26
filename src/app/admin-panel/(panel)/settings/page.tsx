import type { Metadata } from 'next';
import { requireUser } from '@/lib/admin/session';
import { getSettings, SETTING_DEFAULTS } from '@/lib/settings';
import { saveSettings } from '../../_actions/settings';
import ActionForm from '../../_components/ActionForm';
import { Field } from '../../_components/fields';
import formStyle from '../../_components/forms.module.scss';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Ustawienia · Panel KHZiOS' };

export default async function SettingsPage() {
  await requireUser('ADMIN');
  const { contact, accessibility, privacy } = await getSettings();
  const defaultHint = (value: string) =>
    value ? `Domyślnie: ${value}` : undefined;

  return (
    <div className={style.page}>
      <h1>Ustawienia strony</h1>

      <section className={style.card} aria-labelledby="contact">
        <h2 id="contact">Dane kontaktowe katedry</h2>
        <p className={style.muted}>
          Stopka, deklaracja dostępności i polityka prywatności.
        </p>
        <ActionForm action={saveSettings} submitLabel="Zapisz">
          <input type="hidden" name="group" value="contact" />
          <div className={formStyle.row}>
            <Field
              label="E-mail"
              name="email"
              type="email"
              defaultValue={contact.email}
              required
              hint={defaultHint(SETTING_DEFAULTS.contact.email)}
            />
            <Field
              label="Telefon"
              name="phone"
              defaultValue={contact.phone}
              required
              hint={defaultHint(SETTING_DEFAULTS.contact.phone)}
            />
          </div>
        </ActionForm>
      </section>

      <section className={style.card} aria-labelledby="accessibility">
        <h2 id="accessibility">Deklaracja dostępności</h2>
        <p className={style.muted}>
          Ustawa wymaga aktualnych dat. Datę publikacji wpisz w dniu
          uruchomienia strony, datę aktualizacji po istotnych zmianach, a
          przegląd rób co najmniej raz w roku.
        </p>
        <ActionForm action={saveSettings} submitLabel="Zapisz">
          <input type="hidden" name="group" value="accessibility" />
          <div className={formStyle.row}>
            <Field
              label="Data publikacji strony"
              name="published"
              type="date"
              defaultValue={accessibility.published}
            />
            <Field
              label="Ostatnia istotna aktualizacja"
              name="lastUpdated"
              type="date"
              defaultValue={accessibility.lastUpdated}
              required
            />
            <Field
              label="Sporządzenie deklaracji"
              name="prepared"
              type="date"
              defaultValue={accessibility.prepared}
              required
            />
            <Field
              label="Ostatni przegląd deklaracji"
              name="reviewed"
              type="date"
              defaultValue={accessibility.reviewed}
              required
            />
          </div>
        </ActionForm>
      </section>

      <section className={style.card} aria-labelledby="privacy">
        <h2 id="privacy">Polityka prywatności</h2>
        <p className={style.muted}>
          Do potwierdzenia z inspektorem ochrony danych uczelni.
        </p>
        <ActionForm action={saveSettings} submitLabel="Zapisz">
          <input type="hidden" name="group" value="privacy" />
          <Field
            label="Adres administratora danych (uczelni)"
            name="controllerAddress"
            defaultValue={privacy.controllerAddress}
            required
            maxLength={300}
          />
          <div className={formStyle.row}>
            <Field
              label="E-mail inspektora ochrony danych"
              name="dpoEmail"
              type="email"
              defaultValue={privacy.dpoEmail}
              hint="Puste: polityka odsyła do strony uczelni."
            />
            <Field
              label="Data aktualizacji polityki"
              name="lastUpdated"
              type="date"
              defaultValue={privacy.lastUpdated}
              required
            />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
