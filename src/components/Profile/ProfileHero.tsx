import Image from 'next/image';
import type { ReactNode } from 'react';
import { User } from 'lucide-react';
import style from './Profile.module.scss';

interface ProfileHeroProps {
  name: string;
  /** Academic title or role shown above the name */
  title?: string;
  photoUrl?: string | null;
  /** Shown instead of a photo; a generic person icon by default */
  fallbackIcon?: ReactNode;
  /** Extra content under the name, e.g. the person's team */
  children?: ReactNode;
  /** 2 when the page already has its own h1 */
  headingLevel?: 1 | 2;
}

export default function ProfileHero({
  name,
  title,
  photoUrl,
  fallbackIcon,
  children,
  headingLevel = 1,
}: ProfileHeroProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className={style.heroCard}>
      <div className={style.avatarContainer}>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            className={style.avatar}
            sizes="150px"
          />
        ) : (
          <div className={style.avatarFallback}>
            {fallbackIcon ?? <User aria-hidden="true" size={56} />}
          </div>
        )}
      </div>
      <div className={style.heroInfo}>
        {title && <span className={style.heroTitle}>{title}</span>}
        <Heading className={style.heroName}>{name}</Heading>
        {children}
      </div>
    </div>
  );
}
