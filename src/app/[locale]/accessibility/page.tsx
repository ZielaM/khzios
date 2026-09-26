import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { setPageLocale } from '@/i18n/page-locale';
import { telHref } from '@/lib/contact';
import { getSettings } from '@/lib/settings';
import { formatDate } from '@/lib/dates';
import { getAppUrl, pageMetadata } from '@/lib/seo';
import { renderOnFirstRequest } from '@/lib/static-params';
import style from './page.module.scss';
import PageHeader from '@/components/PageHeader';

// The page itself is static text, but the layout reads the team menu from
// the database, which is not available during `next build`.
// Refreshed after every panel edit and daily (see revalidatePublicSite)
export const revalidate = 86400;
export const generateStaticParams = renderOnFirstRequest;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);
  const t = await getTranslations('AccessibilityPage');

  return pageMetadata({
    locale,
    href: '/accessibility',
    title: t('title'),
    description: t('metaDescription'),
  });
}

/**
 * Accessibility statement in the structure of the official template
 * (Act of 4 April 2019). The a11y-* ids come from that template and let
 * automated monitoring find each part.
 */
export default async function AccessibilityPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);
  const t = await getTranslations('AccessibilityPage');
  const { accessibility: dates, contact } = await getSettings();

  const date = (id: string, value: string) => (
    <time id={id} dateTime={value}>
      {formatDate(value, locale)}
    </time>
  );
  const externalLink = (href: string) =>
    function ExternalLink(chunks: ReactNode) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {chunks}
        </a>
      );
    };

  return (
    <div className={style.page}>
      <PageHeader title={t('title')} breadcrumbs={[]} />
      <article className={style.statement}>
        <p id="a11y-wstep">
          {t.rich('intro', {
            org: (chunks) => <span id="a11y-podmiot">{chunks}</span>,
            site: (chunks) => (
              <a id="a11y-url" href={getAppUrl()}>
                {chunks}
              </a>
            ),
          })}
        </p>
        <dl className={style.facts}>
          {/* Set in the admin panel when the site goes live */}
          {dates.published && (
            <>
              <dt>{t('publishedLabel')}</dt>
              <dd>{date('a11y-data-publikacja', dates.published)}</dd>
            </>
          )}
          <dt>{t('updatedLabel')}</dt>
          <dd>{date('a11y-data-aktualizacja', dates.lastUpdated)}</dd>
        </dl>

        <section aria-labelledby="a11y-status-heading">
          <h2 id="a11y-status-heading">{t('statusTitle')}</h2>
          <p id="a11y-status">{t('status')}</p>
          <h3>{t('issuesTitle')}</h3>
          <ul>
            <li>{t('issueAlt')}</li>
            <li>{t('issueDocuments')}</li>
            <li>{t('issueMap')}</li>
            <li>{t('issueLanguages')}</li>
          </ul>
        </section>

        <section aria-labelledby="a11y-preparation-heading">
          <h2 id="a11y-preparation-heading">{t('preparationTitle')}</h2>
          <dl className={style.facts}>
            <dt>{t('preparedLabel')}</dt>
            <dd>{date('a11y-data-sporzadzenie', dates.prepared)}</dd>
            <dt>{t('reviewedLabel')}</dt>
            <dd>{date('a11y-data-przeglad', dates.reviewed)}</dd>
          </dl>
          <p id="a11y-ocena">{t('assessment')}</p>
        </section>

        <section aria-labelledby="a11y-features-heading">
          <h2 id="a11y-features-heading">{t('featuresTitle')}</h2>
          <ul>
            <li>{t('featureContrast')}</li>
            <li>{t('featureSkip')}</li>
            <li>{t('featureKeyboard')}</li>
            <li>{t('featureMotion')}</li>
            <li>{t('featureLanguages')}</li>
          </ul>
        </section>

        <section id="a11y-kontakt" aria-labelledby="a11y-contact-heading">
          <h2 id="a11y-contact-heading">{t('contactTitle')}</h2>
          <p>{t('contactIntro')}</p>
          <dl className={style.facts}>
            <dt>{t('personLabel')}</dt>
            <dd id="a11y-osoba">{t('person')}</dd>
            <dt>{t('emailLabel')}</dt>
            <dd>
              <a id="a11y-email" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </dd>
            <dt>{t('phoneLabel')}</dt>
            <dd>
              <a id="a11y-telefon" href={telHref(contact.phone)}>
                {contact.phone}
              </a>
            </dd>
          </dl>
        </section>

        <section id="a11y-procedura" aria-labelledby="a11y-procedure-heading">
          <h2 id="a11y-procedure-heading">{t('procedureTitle')}</h2>
          <p>{t('procedureRequest')}</p>
          <p>{t('procedureDeadline')}</p>
          <p>{t('procedureComplaint')}</p>
          <p>
            {t.rich('procedureOmbudsman', {
              link: externalLink('https://bip.brpo.gov.pl/'),
            })}
          </p>
        </section>

        <section
          id="a11y-architektura"
          aria-labelledby="a11y-architecture-heading"
        >
          <h2 id="a11y-architecture-heading">{t('architectureTitle')}</h2>
          <p>
            {t.rich('architecture', {
              link: externalLink('https://www.up.poznan.pl/'),
            })}
          </p>
        </section>

        <section id="a11y-aplikacje" aria-labelledby="a11y-apps-heading">
          <h2 id="a11y-apps-heading">{t('appsTitle')}</h2>
          <p>{t('apps')}</p>
        </section>
      </article>
    </div>
  );
}
