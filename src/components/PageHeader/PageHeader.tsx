import type { ReactNode } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs';
import type { SiteImage } from '@/lib/site-images';
import style from './PageHeader.module.scss';

interface PageHeaderProps {
  /** Plain-text title, also the last breadcrumb */
  title: string;
  /** Replaces `title` in the heading when it needs markup */
  heading?: ReactNode;
  lead?: ReactNode;
  breadcrumbs: Crumb[];
  /** A real photo shown beside the text; the page's largest image */
  image?: SiteImage | null;
  /** Controls below the lead, e.g. a search form */
  children?: ReactNode;
}

/** Top of a page: breadcrumbs, title, optional lead and photo. */
export default function PageHeader({
  title,
  heading,
  lead,
  breadcrumbs,
  image,
  children,
}: PageHeaderProps) {
  return (
    <header className={style.header}>
      <Breadcrumbs items={breadcrumbs} current={title} />
      <div className={clsx(style.body, image && style.withImage)}>
        <div>
          <h1 className={style.title}>{heading ?? title}</h1>
          {lead && <p className={style.lead}>{lead}</p>}
          {children}
        </div>
        {image && (
          <div className={style.image}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
      </div>
    </header>
  );
}
