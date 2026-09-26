import style from './forms.module.scss';

/** Error or confirmation after a form action, announced to screen readers. */
export default function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (error) {
    return (
      <p className={style.error} role="alert">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p className={style.success} role="status">
        {message}
      </p>
    );
  }
  return null;
}
