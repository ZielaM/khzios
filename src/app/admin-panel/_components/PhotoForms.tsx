'use client';

import { useActionState } from 'react';
import { savePhotoAlts, uploadNewsPhotos } from '../_actions/news';
import type { FormState } from '@/lib/admin/form';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

export function PhotoUploadForm({ newsId }: { newsId: string }) {
  const [state, action] = useActionState<FormState, FormData>(
    uploadNewsPhotos,
    {}
  );
  return (
    <form action={action} className={style.form}>
      <input type="hidden" name="newsId" value={newsId} />
      <FormMessage error={state.error} message={state.message} />
      <label className={style.field}>
        <span>Dodaj zdjęcia</span>
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
        />
        <small>
          JPG, PNG lub WebP do 15 MB. Zdjęcia zostaną zmniejszone do 2560 px, a
          dane z aparatu (w tym położenie GPS) usunięte.
        </small>
      </label>
      <SubmitButton pendingLabel="Wgrywanie…">Wgraj</SubmitButton>
    </form>
  );
}

export function PhotoAltForm({
  photoId,
  alts,
}: {
  photoId: string;
  alts: { code: string; label: string; alt: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    savePhotoAlts,
    {}
  );
  return (
    <form action={action} className={style.form}>
      <input type="hidden" name="photoId" value={photoId} />
      <FormMessage error={state.error} message={state.message} />
      {alts.map((a) => (
        <label key={a.code} className={style.field}>
          <span>Opis zdjęcia ({a.label.toLowerCase()})</span>
          <input name={`alt_${a.code}`} defaultValue={a.alt} maxLength={300} />
        </label>
      ))}
      <SubmitButton>Zapisz opis</SubmitButton>
    </form>
  );
}
