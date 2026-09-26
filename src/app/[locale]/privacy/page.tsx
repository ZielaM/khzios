import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageHeader from '@/components/PageHeader';
import { setPageLocale } from '@/i18n/page-locale';
import { formatDate } from '@/lib/dates';
import { getSettings } from '@/lib/settings';
import { pageMetadata } from '@/lib/seo';
import { renderOnFirstRequest } from '@/lib/static-params';
import style from './page.module.scss';

// Static text, but the layout reads the team menu from the database
export const revalidate = 604800;
export const generateStaticParams = renderOnFirstRequest;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);
  const t = await getTranslations('PrivacyPage');

  return pageMetadata({
    locale,
    href: '/privacy',
    title: t('title'),
    description: t('metaDescription'),
  });
}

const UNIVERSITY_URL = 'https://www.up.poznan.pl/';

const externalLink = (href: string) =>
  function ExternalLink(chunks: ReactNode) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {chunks}
      </a>
    );
  };

const mailLink = (email: string) =>
  function MailLink(chunks: ReactNode) {
    return <a href={`mailto:${email}`}>{chunks}</a>;
  };

/** Everything the site keeps in the browser; update when the code changes. */
const BROWSER_STORAGE = [
  {
    name: 'NEXT_LOCALE',
    type: 'typeCookie',
    purpose: 'localePurpose',
    duration: 'untilClose',
  },
  {
    name: 'wcag-high-contrast',
    type: 'typeLocal',
    purpose: 'contrastPurpose',
    duration: 'untilCleared',
  },
  {
    name: 'wcag-font-offset',
    type: 'typeLocal',
    purpose: 'fontPurpose',
    duration: 'untilCleared',
  },
] as const;

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setPageLocale(locale);
  const t = await getTranslations('PrivacyPage');
  const tFooter = await getTranslations('Footer');
  const { privacy, contact } = await getSettings();

  return (
    <div className={style.page}>
      <PageHeader
        title={t('title')}
        lead={t('updatedLabel', {
          date: formatDate(privacy.lastUpdated, locale),
        })}
        breadcrumbs={[]}
      />

      <article className={style.policy}>
        <p>{t('intro')}</p>

        <section aria-labelledby="privacy-controller">
          <h2 id="privacy-controller">{t('controllerTitle')}</h2>
          <p>
            {t.rich('controller', {
              university: tFooter('university'),
              address: privacy.controllerAddress,
              email: contact.email,
              phone: contact.phone,
              mail: mailLink(contact.email),
            })}
          </p>
          <p>
            {privacy.dpoEmail
              ? t.rich('dpoEmail', {
                  email: privacy.dpoEmail,
                  mail: mailLink(privacy.dpoEmail),
                })
              : t.rich('dpoLink', {
                  link: externalLink(UNIVERSITY_URL),
                })}
          </p>
        </section>

        <section aria-labelledby="privacy-logs">
          <h2 id="privacy-logs">{t('logsTitle')}</h2>
          <p>{t('logs')}</p>
          <p>{t('logsBasis')}</p>
        </section>

        <section aria-labelledby="privacy-storage">
          <h2 id="privacy-storage">{t('storageTitle')}</h2>
          <p>{t('storageIntro')}</p>
          <div className={style.tableContainer}>
            <table className={style.table}>
              <caption className={style.caption}>{t('storageCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('colName')}</th>
                  <th scope="col">{t('colType')}</th>
                  <th scope="col">{t('colPurpose')}</th>
                  <th scope="col">{t('colDuration')}</th>
                </tr>
              </thead>
              <tbody>
                {BROWSER_STORAGE.map((item) => (
                  <tr key={item.name}>
                    <th scope="row" data-label={t('colName')}>
                      <code>{item.name}</code>
                    </th>
                    <td data-label={t('colType')}>{t(item.type)}</td>
                    <td data-label={t('colPurpose')}>{t(item.purpose)}</td>
                    <td data-label={t('colDuration')}>{t(item.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{t('storageNote')}</p>
        </section>

        <section aria-labelledby="privacy-map">
          <h2 id="privacy-map">{t('mapTitle')}</h2>
          <p>
            {t.rich('map', {
              link: externalLink('https://policies.google.com/privacy'),
            })}
          </p>
        </section>

        <section aria-labelledby="privacy-other">
          <h2 id="privacy-other">{t('otherTitle')}</h2>
          <p>{t('other')}</p>
        </section>

        <section aria-labelledby="privacy-messages">
          <h2 id="privacy-messages">{t('messagesTitle')}</h2>
          <p>{t('messages')}</p>
        </section>

        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">{t('rightsTitle')}</h2>
          <p>
            {t.rich('rights', {
              link: externalLink('https://uodo.gov.pl/'),
            })}
          </p>
        </section>
      </article>
    </div>
  );
}
