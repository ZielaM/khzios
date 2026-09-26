import Link from 'next/link';

// Only reached by paths the proxy does not handle (e.g. /some-file.php);
// everything else is redirected to a locale and gets the translated 404
export default function GlobalNotFound() {
  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#1a1a2e',
          background: '#fff',
        }}
      >
        <main>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>404</h1>
          <p style={{ margin: 0 }}>Nie znaleziono strony.</p>
          <p lang="en" style={{ margin: '0.25rem 0 2rem', color: '#5a6a60' }}>
            Page not found.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.8rem 1.5rem',
              borderRadius: 8,
              background: '#1b5e3b',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Strona główna / Home
          </Link>
        </main>
      </body>
    </html>
  );
}
