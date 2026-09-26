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
}

export default function ProfileHero({
  name,
  title,
  photoUrl,
  fallbackIcon,
  children,
}: ProfileHeroProps) {
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
        <h1 className={style.heroName}>{name}</h1>
        {children}
      </div>
    </div>
  );
}
