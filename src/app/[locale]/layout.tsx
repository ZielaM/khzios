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
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://khzios.up.poznan.pl';

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
      url: appUrl,
      siteName: t('heroTitle'),
      images: [
        {
          url: '/openGraph.png',
          width: 1200,
          height: 630,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('heroTitle'),
      description: t('heroSubtitle'),
      images: ['/openGraph.png'],
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
  const messages = await getMessages();
  const tWcag = await getTranslations('Wcag');

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
        <NextIntlClientProvider messages={messages}>
          <ScrollRestoration />
          <a href="#main-content" className="skip-link">
            {tWcag('skipToMain')}
          </a>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
