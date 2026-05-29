import { useTranslations } from 'next-intl';
import style from './TeamResearch.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import AnimateOnce from '@/components/AnimateOnce';

interface TeamResearchProps {
  content?: string | null;
}

export default function TeamResearch({ content }: TeamResearchProps) {
  const t = useTranslations('TeamPage');

  if (!content) return null;

  return (
    <section className={style.section}>
      <AnimateOnce>
        <h2 className={style.sectionTitle}>{t('researchTitle')}</h2>
      </AnimateOnce>
      <AnimateOnce>
        <div
          className={style.content}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </AnimateOnce>
    </section>
  );
}
