'use client';

import { usePathname } from 'next/navigation';

// Replaces the root layout when the layout itself fails, so neither the
// translations nor the site styles can be relied on here
const TEXTS = {
  pl: {
    title: 'Coś poszło nie tak',
    description: 'Nie udało się wyświetlić strony. Spróbuj ponownie za chwilę.',
    retry: 'Spróbuj ponownie',
  },
  en: {
    title: 'Something went wrong',
    description: 'The page could not be displayed. Please try again shortly.',
    retry: 'Try again',
  },
  uk: {
    title: 'Щось пішло не так',
    description: 'Не вдалося показати сторінку. Спробуйте ще раз за хвилину.',
    retry: 'Спробувати ще раз',
  },
  ru: {
    title: 'Что-то пошло не так',
    description:
      'Не удалось отобразить страницу. Попробуйте ещё раз через минуту.',
    retry: 'Попробовать снова',
  },
};

type Lang = keyof typeof TEXTS;

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const segment = usePathname()?.split('/')[1] ?? '';
  const lang: Lang = segment in TEXTS ? (segment as Lang) : 'pl';
  const t = TEXTS[lang];

  return (
    <html lang={lang}>
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
          <h1 style={{ fontSize: '2rem', margin: '0 0 1rem' }}>{t.title}</h1>
          <p style={{ margin: '0 0 2rem', color: '#5a6a60' }}>
            {t.description}
          </p>
          {/* A full reload: the layout has to be rendered again */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              font: 'inherit',
              fontWeight: 600,
              padding: '0.8rem 1.5rem',
              border: 0,
              borderRadius: 8,
              background: '#1b5e3b',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {t.retry}
          </button>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
