import { useTranslations } from 'next-intl';
import style from './TeamResearch.module.scss';
import DOMPurify from 'isomorphic-dompurify';

interface TeamResearchProps {
  content?: string | null;
}

export default function TeamResearch({ content }: TeamResearchProps) {
  const t = useTranslations('TeamPage');

  if (!content) return null;

  return (
    <section className={style.section}>
      <h2 className={style.sectionTitle}>{t('researchTitle')}</h2>
      <div
        className={style.content}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    </section>
  );
}
