import type { Metadata } from 'next';
import Link from 'next/link';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import { generateTotpSecret, totpUri } from '@/lib/admin/totp';
import { purgeExpiredTrash } from '@/lib/admin/trash';
import { getSettings } from '@/lib/settings';
import EnrollmentForm from './_components/EnrollmentForm';
import PasswordForm from './_components/PasswordForm';
import SecondFactorForm from './_components/SecondFactorForm';
import SignInForm from './_components/SignInForm';
import AuthCard from './_components/AuthCard';
import AdminShell from './_components/AdminShell';
import { NAV_ITEMS } from './_components/nav-items';
import style from './_components/pages.module.scss';

export const metadata: Metadata = { title: 'Panel KHZiOS' };

/**
 * The only panel address that answers without a session: sign-in, the
 * second factor, first-time 2FA setup, a required password change, and
 * once all of that is done, the dashboard.
 */
export default async function AdminHome() {
  const session = await getSession();

  if (!session) {
    return (
      <AuthCard title="Logowanie">
        <SignInForm />
      </AuthCard>
    );
  }

  const { user } = session;

  if (!session.mfaPassed) {
    if (user.totpSecret) {
      return (
        <AuthCard title="Weryfikacja dwuetapowa">
          <SecondFactorForm />
        </AuthCard>
      );
    }

    // First sign-in: a secret waits in the session until it is confirmed
    let secret = session.totpPendingSecret;
    if (!secret) {
      secret = generateTotpSecret();
      await prisma.adminSession.update({
        where: { tokenHash: session.tokenHash },
        data: { totpPendingSecret: secret },
      });
    }
    const qrCode = await QRCode.toDataURL(totpUri(secret, user.login), {
      margin: 1,
      width: 200,
    });
    return (
      <AuthCard title="Włącz logowanie dwuskładnikowe">
        <EnrollmentForm
          qrCode={qrCode}
          secret={secret}
          continueHref={adminHref()}
        />
      </AuthCard>
    );
  }

  if (user.mustChangePassword) {
    return (
      <AuthCard title="Ustaw nowe hasło">
        <p>Konto ma hasło tymczasowe. Przed dalszą pracą ustaw własne.</p>
        <PasswordForm />
      </AuthCard>
    );
  }

  // Opening the dashboard also clears items older than 30 days from the trash
  await purgeExpiredTrash();
  const [
    recentChanges,
    settings,
    head,
    secretariat,
    heroImages,
    photosWithoutAlt,
  ] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    getSettings(),
    prisma.departmentHead.count(),
    prisma.secretariat.count(),
    prisma.siteImage.count({ where: { section: 'hero' } }),
    prisma.photo.count({
      where: { translations: { none: { languageCode: 'pl' } } },
    }),
  ]);
  const isAdmin = user.role === 'ADMIN';
  const todo = [
    !settings.accessibility.published && {
      text: 'Wpisz datę publikacji strony w deklaracji dostępności (w dniu uruchomienia strony).',
      href: isAdmin ? '/settings' : undefined,
    },
    !settings.privacy.dpoEmail && {
      text: 'Wpisz e-mail inspektora ochrony danych uczelni w polityce prywatności.',
      href: isAdmin ? '/settings' : undefined,
    },
    head === 0 && { text: 'Wskaż kierownika katedry.', href: '/office' },
    secretariat === 0 && {
      text: 'Uzupełnij dane sekretariatu (strona Kontakt).',
      href: '/office',
    },
    heroImages === 0 && {
      text: 'Dodaj zdjęcia na stronę główną.',
      href: '/images',
    },
    photosWithoutAlt > 0 && {
      text: `Zdjęcia w aktualnościach bez opisu po polsku: ${photosWithoutAlt}.`,
      href: '/news',
    },
  ].filter((item): item is { text: string; href: string | undefined } =>
    Boolean(item)
  );

  return (
    <AdminShell
      base={adminHref()}
      user={{ name: user.name, role: user.role }}
      items={NAV_ITEMS}
    >
      <div className={style.page}>
        <h1>Pulpit</h1>
        <p>Witaj, {user.name}.</p>

        {todo.length > 0 && (
          <section aria-labelledby="todo" className={style.card}>
            <h2 id="todo">Do uzupełnienia</h2>
            <ul>
              {todo.map((item) => (
                <li key={item.text}>
                  {item.href ? (
                    <Link href={adminHref(item.href)}>{item.text}</Link>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="recent-changes">
          <h2 id="recent-changes">Ostatnie zmiany</h2>
          {recentChanges.length === 0 ? (
            <p className={style.muted}>Nie ma jeszcze żadnych zmian.</p>
          ) : (
            <ul className={style.activity}>
              {recentChanges.map((entry) => (
                <li key={entry.id}>
                  <time dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toLocaleString('pl-PL', {
                      timeZone: 'Europe/Warsaw',
                    })}
                  </time>{' '}
                  <strong>{entry.userLogin}</strong>: {entry.summary}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p>
          <Link href={adminHref('/account')}>Zmień hasło</Link>
        </p>
      </div>
    </AdminShell>
  );
}
