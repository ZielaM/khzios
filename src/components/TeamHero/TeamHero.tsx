import style from './TeamHero.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import HeroSlideshow from '@/components/HeroSlideshow';
import type { SiteImage } from '@/lib/site-images';

interface TeamHeroProps {
  name: string;
  /** Optional banner photo from `public/images/teams/<slug>/` */
  image?: SiteImage | null;
}

export default function TeamHero({ name, image }: TeamHeroProps) {
  return (
    <section className={style.hero}>
      {image && <HeroSlideshow images={[image]} />}
      <div className={style.heroContent}>
        <h1
          className={style.title}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(name) }}
        />
      </div>
    </section>
  );
}
