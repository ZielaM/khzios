import { Link } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';
import React, { ComponentProps } from 'react';
import style from './BackLink.module.scss';
import clsx from 'clsx';

interface BackLinkProps {
  href: ComponentProps<typeof Link>['href'];
  children: React.ReactNode;
  className?: string;
}

export default function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link href={href} className={clsx(style.backLink, className)}>
      <ChevronLeft size={20} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
