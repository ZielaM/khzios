import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LOG_RETENTION_DAYS, purgeOldLogs } from '@/lib/admin/audit';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Dziennik · Panel KHZiOS' };

const PAGE_SIZE = 50;
const TABS = [
  { key: 'changes', label: 'Zmiany treści' },
  { key: 'logins', label: 'Logowania' },
  { key: 'security', label: 'Podejrzane zapytania' },
] as const;

const time = (date: Date) =>
  date.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser('ADMIN');
  const params = await searchParams;
  const tab = TABS.find((t) => t.key === params.tab)?.key ?? 'changes';
  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  await purgeOldLogs();

  let rows: { id: string; cells: React.ReactNode[] }[] = [];
  let headers: string[] = [];
  let total = 0;
  if (tab === 'changes') {
    headers = ['Czas', 'Kto', 'Zmiana'];
    const [items, count] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count(),
    ]);
    total = count;
    rows = items.map((e) => ({
      id: e.id,
      cells: [time(e.createdAt), e.userLogin, e.summary],
    }));
  } else if (tab === 'logins') {
    headers = ['Czas', 'Login', 'Adres IP', 'Wynik'];
    const [items, count] = await Promise.all([
      prisma.loginAttempt.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.loginAttempt.count(),
    ]);
    total = count;
    const reasons: Record<string, string> = {
      password: 'złe hasło lub login',
      totp: 'zły kod 2FA',
      locked: 'zablokowane (zbyt wiele prób)',
      disabled: 'konto zablokowane',
    };
    rows = items.map((e) => ({
      id: e.id,
      cells: [
        time(e.createdAt),
        e.login,
        e.ip,
        e.success
          ? 'udane'
          : `nieudane: ${reasons[e.reason ?? ''] ?? e.reason}`,
      ],
    }));
  } else {
    headers = ['Czas', 'Rodzaj', 'Miejsce', 'Fragment zapytania'];
    const [items, count] = await Promise.all([
      prisma.securityEvent.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.securityEvent.count(),
    ]);
    total = count;
    rows = items.map((e) => ({
      id: e.id,
      cells: [
        time(e.createdAt),
        e.threats.join(', '),
        e.context,
        <code key="p">{e.preview}</code>,
      ],
    }));
  }
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={style.page}>
      <h1>Dziennik</h1>
      <nav className={style.inlineActions} aria-label="Rodzaj wpisów">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={adminHref(`/logs?tab=${t.key}`)}
            aria-current={t.key === tab ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === 'security' && (
        <p className={style.muted}>
          Wpisy w wyszukiwarkach wyglądające na próbę ataku (np. wstrzyknięcie
          SQL). Strona i tak je unieszkodliwia; dziennik pokazuje, czy ktoś
          próbuje.
        </p>
      )}
      {tab !== 'changes' && (
        <p className={style.muted}>
          Wpisy starsze niż {LOG_RETENTION_DAYS} dni są usuwane.
        </p>
      )}
      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className={style.muted}>Brak wpisów.</p>}
      {pages > 1 && (
        <nav className={style.pager} aria-label="Strony dziennika">
          {page > 1 && (
            <Link href={adminHref(`/logs?tab=${tab}&page=${page - 1}`)}>
              ← Nowsze
            </Link>
          )}
          <span>
            Strona {page} z {pages}
          </span>
          {page < pages && (
            <Link href={adminHref(`/logs?tab=${tab}&page=${page + 1}`)}>
              Starsze →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
