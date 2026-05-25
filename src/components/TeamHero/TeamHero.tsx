import style from './TeamHero.module.scss';
import DOMPurify from 'isomorphic-dompurify';

interface TeamHeroProps {
  name: string;
}

export default function TeamHero({ name }: TeamHeroProps) {
  return (
    <section className={style.hero}>
      <div className={style.heroContent}>
        <h1
          className={style.title}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(name) }}
        />
      </div>
    </section>
  );
}
