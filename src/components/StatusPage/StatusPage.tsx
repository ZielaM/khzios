import type { ReactNode } from 'react';
import style from './StatusPage.module.scss';

interface StatusPageProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Links or buttons below the text */
  children: ReactNode;
}

/** Full-page message for the 404 and error pages. */
export default function StatusPage({
  icon,
  title,
  description,
  children,
}: StatusPageProps) {
  return (
    <div className={style.container}>
      <div className={style.icon} aria-hidden="true">
        {icon}
      </div>
      <h1 className={style.title}>{title}</h1>
      <p className={style.description}>{description}</p>
      <div className={style.actions}>{children}</div>
    </div>
  );
}
