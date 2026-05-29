import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, routing } from '@/i18n/routing';
import { Metadata } from 'next';
import { ArrowRight, BookOpen, Network } from 'lucide-react';
import BackLink from '@/components/BackLink';
import AnimateOnce from '@/components/AnimateOnce';
import style from './page.module.scss';

// ISR every 7 days
export const revalidate = 604800;

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('AboutUsPage');
  return { title: `${t('title')} | KHZIOS` };
}

export default async function AboutUsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('AboutUsPage');
  const tStruct = await getTranslations('StructurePage');

  return (
    <div className={style.page}>
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
      </AnimateOnce>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <AnimateOnce>
        <section className={style.hero}>
          <h1 className={style.heroTitle}>{t('title')}</h1>
          <p className={style.heroDesc}>{t('description')}</p>
        </section>
      </AnimateOnce>

      <div className={style.grid}>
        <AnimateOnce>
          <Link href="/about-us/structure" className={style.card}>
            <div className={style.cardIconWrapper}>
              <Network size={26} />
            </div>
            <h3 className={style.cardTitle}>{t('structureCardTitle')}</h3>
            <p className={style.cardDesc}>{t('structureCardDesc')}</p>
            <span className={style.cardFooter}>
              {t('viewDetails')}
              <ArrowRight size={16} className={style.cardArrow} />
            </span>
          </Link>
        </AnimateOnce>

        <AnimateOnce>
          <Link href="/about-us/publications" className={style.card}>
            <div className={style.cardIconWrapper}>
              <BookOpen size={26} />
            </div>
            <h3 className={style.cardTitle}>{t('publicationsCardTitle')}</h3>
            <p className={style.cardDesc}>{t('publicationsCardDesc')}</p>
            <span className={style.cardFooter}>
              {t('viewDetails')}
              <ArrowRight size={16} className={style.cardArrow} />
            </span>
          </Link>
        </AnimateOnce>
      </div>
    </div>
  );
}
