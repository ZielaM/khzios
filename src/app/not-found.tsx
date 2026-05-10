import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

// This global not-found.tsx is necessary to catch errors outside of
// the [locale] segment (e.g., when the locale is missing or unsupported).
export default function GlobalNotFound() {
  // Basic styling since we might not have the main styles loaded here
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f9f9f9',
            color: '#333',
          }}
        >
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>404</h1>
          <p style={{ fontSize: '1.2rem', margin: '0 0 2rem 0' }}>
            Nie znaleziono strony. / Page not found.
          </p>
          <Link
            href="/"
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: '#247151',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            Go to homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
