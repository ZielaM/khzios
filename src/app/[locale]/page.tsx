import { Suspense } from 'react';
import styles from './page.module.scss';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import RecentNewsServer from '@/components/RecentNews/RecentNewsServer';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';
import AnimateOnce from '@/components/AnimateOnce';
import { BookOpen, GraduationCap, Network, Phone } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  return (
    <div className={styles.main}>
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <AnimateOnce>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
          <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
          <div className={styles.heroActions}>
            <Link href="/about-us" className={styles.primaryBtn}>
              {t('btnAboutUs')}
            </Link>
            <Link href="/student" className={styles.secondaryBtn}>
              {t('btnStudent')}
            </Link>
          </div>
        </section>
      </AnimateOnce>

      {/* ── Recent News ────────────────────────────────────────────────── */}
      <section className={styles.newsSection}>
        <AnimateOnce>
          <h2 className={styles.sectionTitle}>{t('recentNewsTitle')}</h2>
        </AnimateOnce>

        <Suspense fallback={<RecentNewsSkeleton />}>
          <RecentNewsServer locale={locale} />
        </Suspense>

        <AnimateOnce>
          <div className={styles.newsFooter}>
            <Link href="/news">
              {t('viewAllNews')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimateOnce>
      </section>

      {/* ── Quick Links (Bento Grid) ──────────────────────────────────── */}
      <AnimateOnce>
        <h2 className={styles.sectionTitle}>{t('quickLinksTitle')}</h2>
      </AnimateOnce>

      <div className={styles.bentoGrid}>
        <AnimateOnce>
          <Link href="/student" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper}>
              <GraduationCap size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('btnStudent')}</h3>
              <p className={styles.cardDesc}>{t('linkStudentsDesc')}</p>
            </div>
            <ArrowRight size={20} className={styles.cardArrow} />
          </Link>
        </AnimateOnce>

        <AnimateOnce>
          <Link href="/about-us/structure" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper}>
              <Network size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkStructureTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkStructureDesc')}</p>
            </div>
            <ArrowRight size={20} className={styles.cardArrow} />
          </Link>
        </AnimateOnce>

        <AnimateOnce>
          <Link href="/about-us/publications" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper}>
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkPublicationsTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkPublicationsDesc')}</p>
            </div>
            <ArrowRight size={20} className={styles.cardArrow} />
          </Link>
        </AnimateOnce>

        <AnimateOnce>
          <Link href="/contact" className={styles.bentoCard}>
            <div className={styles.cardIconWrapper}>
              <Phone size={28} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('linkContactTitle')}</h3>
              <p className={styles.cardDesc}>{t('linkContactDesc')}</p>
            </div>
            <ArrowRight size={20} className={styles.cardArrow} />
          </Link>
        </AnimateOnce>
      </div>
    </div>
  );
}
