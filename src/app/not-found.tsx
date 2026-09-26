import PlainNotFound from '@/components/StatusPage/PlainNotFound';

// Only reached by paths the proxy does not handle (e.g. /some-file.php);
// everything else is redirected to a locale and gets the translated 404
export default function GlobalNotFound() {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>
        <PlainNotFound />
      </body>
    </html>
  );
}
