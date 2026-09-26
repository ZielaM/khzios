import type { ReactNode } from 'react';
import clsx from 'clsx';
import style from './Profile.module.scss';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  className?: string;
  children: ReactNode;
}

export default function InfoCard({
  icon,
  title,
  className,
  children,
}: InfoCardProps) {
  return (
    <section className={clsx(style.infoCard, className)}>
      <div className={style.cardHeader}>
        <div className={style.cardIcon} aria-hidden="true">
          {icon}
        </div>
        <h2 className={style.cardTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return <div className={style.infoGrid}>{children}</div>;
}
