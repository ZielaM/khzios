import Image from 'next/image';
import clsx from 'clsx';
import type { SiteImage } from '@/lib/site-images';
import style from './PageBanner.module.scss';

interface PageBannerProps {
  image: SiteImage;
  /** Sets the banner's size / aspect ratio in the parent layout */
  className?: string;
  sizes?: string;
  preload?: boolean;
}

/** Rounded, cover-cropped content photo (e.g. student zone, building entrance). */
export default function PageBanner({
  image,
  className,
  sizes = '(max-width: 1200px) 100vw, 1200px',
  preload = false,
}: PageBannerProps) {
  return (
    <div className={clsx(style.banner, className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload={preload}
        sizes={sizes}
        className={style.image}
      />
    </div>
  );
}
