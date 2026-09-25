import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.scss';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollRestoration from '@/components/ScrollRestoration/ScrollRestoration';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { DEFAULT_OG_IMAGE, getAppUrl } from '@/lib/seo';
import { getNavigationTeams } from '@/lib/team-queries';
import { pickClientMessages } from '@/i18n/client-messages';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  const appUrl = getAppUrl();

  return {
    metadataBase: new URL(appUrl),
    title: {
      template: `%s | ${t('heroTitle')}`,
      default: t('heroTitle'),
    },
    description: t('heroSubtitle'),
    openGraph: {
      title: t('heroTitle'),
      description: t('heroSubtitle'),
      siteName: t('heroTitle'),
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: t('heroTitle'),
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('heroTitle'),
      description: t('heroSubtitle'),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [messages, tWcag, teams] = await Promise.all([
    getMessages(),
    getTranslations('Wcag'),
    getNavigationTeams(locale),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* script to avoid visual flash before WCAG preferences, font scaling and page layout are applied */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('wcag-high-contrast') === 'true') {
                  document.documentElement.classList.add('wcag-high-contrast');
                }
                var fontOffset = parseInt(localStorage.getItem('wcag-font-offset') || '0', 10);
                var scale = 1;
                if (!isNaN(fontOffset) && fontOffset !== 0) {
                  scale = 1 + fontOffset * 0.1;
                  document.documentElement.style.setProperty('--wcag-font-scale', scale.toString());
                }
                var ew = window.innerWidth / scale;
                if (ew < 1024) document.documentElement.classList.add('compact-layout');
                if (ew < 768) document.documentElement.classList.add('compact-layout-sm');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <NextIntlClientProvider messages={pickClientMessages(messages)}>
          <ScrollRestoration />
          <a href="#main-content" className="skip-link">
            {tWcag('skipToMain')}
          </a>
          <Navbar teams={teams} />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
