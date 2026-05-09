import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.scss';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

export const metadata: Metadata = {
  title: 'Katedra Hodowli Zwierząt i Oceny Surowców',
  description: 'Katedra Hodowli Zwierząt i Oceny Surowców',
};

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
    <html lang={locale}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('wcag-high-contrast') === 'true') {
                  document.documentElement.classList.add('wcag-high-contrast');
                }
                var fontOffset = parseInt(localStorage.getItem('wcag-font-offset') || '0', 10);
                if (!isNaN(fontOffset) && fontOffset !== 0) {
                  document.documentElement.style.setProperty('--wcag-font-scale', (1 + fontOffset * 0.1).toString());
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <NextIntlClientProvider messages={messages}>
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
