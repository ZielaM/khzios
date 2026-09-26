'use client';

import { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home, RotateCcw, TriangleAlert } from 'lucide-react';
import StatusPage from './StatusPage';
import style from './StatusPage.module.scss';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Shown by the error boundary when a page fails to render. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('ErrorPage');
  const router = useRouter();

  // reset() alone only re-renders on the client; the failed part may be a
  // server component, so fetch it again as well
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <StatusPage
      icon={<TriangleAlert size={120} strokeWidth={1.5} />}
      title={t('title')}
      description={t('description')}
    >
      <button type="button" className={style.primaryButton} onClick={retry}>
        <RotateCcw aria-hidden="true" size={20} />
        {t('retry')}
      </button>
      <Link href="/" className={style.secondaryButton}>
        <Home aria-hidden="true" size={20} />
        {t('backHome')}
      </Link>
      {error.digest && (
        // Matches the digest in the server log
        <p className={style.digest}>{t('code', { code: error.digest })}</p>
      )}
    </StatusPage>
  );
}
