import type { ReactNode } from 'react';
import style from './pages.module.scss';

/** Centred box for sign-in steps, shown without the panel navigation. */
export default function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className={style.authPage}>
      <div className={style.authCard}>
        <p className={style.authBrand}>Panel KHZiOS</p>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}
