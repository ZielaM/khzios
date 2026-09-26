import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home, FileQuestion } from 'lucide-react';
import StatusPage from './StatusPage';
import style from './StatusPage.module.scss';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <StatusPage
      icon={<FileQuestion size={120} strokeWidth={1.5} />}
      title={t('title')}
      description={t('description')}
    >
      <Link href="/" className={style.primaryButton}>
        <Home aria-hidden="true" size={20} />
        {t('backHome')}
      </Link>
    </StatusPage>
  );
}
