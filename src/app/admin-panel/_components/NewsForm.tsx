'use client';

import { useActionState } from 'react';
import { saveNews } from '../_actions/news';
import type { FormState } from '@/lib/admin/form';
import FormMessage from './FormMessage';
import LanguageTabs from './LanguageTabs';
import RichTextEditor from './RichTextEditor';
import SubmitButton from './SubmitButton';
import { useKeepValuesOnError } from './useKeepValuesOnError';
import style from './forms.module.scss';

export interface NewsFormProps {
  id?: string;
  published: boolean;
  publishedAt: string;
  languages: { code: string; label: string; title: string; content: string }[];
  tags: { id: string; label: string; checked: boolean }[];
  initialMessage?: string;
}

export default function NewsForm({
  id,
  published,
  publishedAt,
  languages,
  tags,
  initialMessage,
}: NewsFormProps) {
  const [state, action, isPending] = useActionState<FormState, FormData>(
    saveNews,
    { message: initialMessage }
  );
  const { formRef, onSubmit } = useKeepValuesOnError(state);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={onSubmit}
      className={`${style.form} ${style.wideForm}`}
    >
      {id && <input type="hidden" name="id" value={id} />}
      {!isPending && (
        <FormMessage error={state.error} message={state.message} />
      )}

      <LanguageTabs
        panels={languages.map((lang) => ({
          code: lang.code,
          label: lang.label,
          required: lang.code === 'pl',
          filled: Boolean(lang.title),
          content: (
            <>
              <label className={style.field}>
                <span>Tytuł{lang.code === 'pl' && ' *'}</span>
                <input
                  name={`title_${lang.code}`}
                  defaultValue={lang.title}
                  maxLength={300}
                  required={lang.code === 'pl'}
                />
              </label>
              <RichTextEditor
                name={`content_${lang.code}`}
                label="Treść"
                defaultValue={lang.content}
              />
              {lang.code !== 'pl' && (
                <small>
                  Wersja opcjonalna. Bez niej strona pokaże wersję polską z
                  informacją o języku.
                </small>
              )}
            </>
          ),
        }))}
      />

      {tags.length > 0 && (
        <fieldset className={style.fieldset}>
          <legend>Tagi</legend>
          {tags.map((tag) => (
            <label key={tag.id} className={style.checkboxField}>
              <input
                type="checkbox"
                name="tags"
                value={tag.id}
                defaultChecked={tag.checked}
              />
              {tag.label}
            </label>
          ))}
        </fieldset>
      )}

      {/* Photos of an existing article are managed below the form */}
      {!id && (
        <label className={style.field}>
          <span>Zdjęcia (opcjonalnie)</span>
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
          />
          <small>
            JPG, PNG lub WebP do 15 MB każde, łącznie do 25 MB naraz. Pierwsze
            będzie zdjęciem głównym. Opisy, kolejność i kolejne zdjęcia ustawisz
            po utworzeniu artykułu.
          </small>
        </label>
      )}

      <div className={style.row}>
        <label className={style.field}>
          <span>Data publikacji</span>
          <input type="date" name="publishedAt" defaultValue={publishedAt} />
        </label>
        <label className={style.checkboxField}>
          <input type="checkbox" name="published" defaultChecked={published} />
          Opublikowany (widoczny na stronie)
        </label>
      </div>

      <SubmitButton>{id ? 'Zapisz zmiany' : 'Utwórz'}</SubmitButton>
    </form>
  );
}
