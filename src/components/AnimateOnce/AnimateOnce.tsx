import clsx from 'clsx';
import style from './AnimateOnce.module.scss';

interface AnimateOnceProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Fades its content in as it scrolls into view.
 *
 * Pure CSS (scroll-driven animation): the content is rendered visible, so it
 * is there without JavaScript, for crawlers and before hydration, and it does
 * not delay the largest contentful paint. Browsers without scroll-driven
 * animations and users who prefer reduced motion simply see it immediately.
 */
export default function AnimateOnce({ children, className }: AnimateOnceProps) {
  return <div className={clsx(style.wrapper, className)}>{children}</div>;
}
