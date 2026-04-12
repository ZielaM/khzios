import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.scss';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: 'Katedra Hodowli Zwierząt i Oceny Surowców',
  description: 'Katedra Hodowli Zwierząt i Oceny Surowców',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
