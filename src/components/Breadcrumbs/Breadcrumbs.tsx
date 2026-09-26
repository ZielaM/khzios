import { useLocale, useTranslations } from 'next-intl';
import { getPathname, Link } from '@/i18n/routing';
import JsonLd from '@/components/JsonLd';
import { toAbsoluteUrl } from '@/lib/seo';
import style from './Breadcrumbs.module.scss';

type Href = Parameters<typeof getPathname>[0]['href'];

export interface Crumb {
  label: string;
  href: Href;
}

interface BreadcrumbsProps {
  /** Pages between the home page and the current one */
  items: Crumb[];
  /** Name of the current page (not a link) */
  current: string;
}

/** Trail from the home page to the current page, also as BreadcrumbList data. */
export default function Breadcrumbs({ items, current }: BreadcrumbsProps) {
  const t = useTranslations('Breadcrumbs');
  const locale = useLocale();
  const trail: Crumb[] = [{ label: t('home'), href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ...trail.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.label,
        item: toAbsoluteUrl(getPathname({ locale, href: crumb.href })),
      })),
      { '@type': 'ListItem', position: trail.length + 1, name: current },
    ],
  };

  return (
    <nav aria-label={t('label')} className={style.breadcrumbs}>
      <JsonLd data={jsonLd} />
      <ol>
        {trail.map((crumb) => (
          <li key={crumb.label}>
            <Link href={crumb.href}>{crumb.label}</Link>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
