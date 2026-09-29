import { describe, it, expect } from 'vitest';
import { telHref } from '../contact';
import { getUploadDir } from '../env';
import { renderOnFirstRequest } from '../static-params';
import { keepMarksOnly, sanitizeArticleHtml } from '../content-utils';

describe('small helpers', () => {
  it('turns a written phone number into a tel: link', () => {
    expect(telHref('+48 61 848 72 45')).toBe('tel:+48618487245');
  });

  it('keeps uploads in ./uploads unless UPLOAD_DIR says otherwise', () => {
    expect(getUploadDir({ NODE_ENV: 'production' })).toBe('./uploads');
    expect(
      getUploadDir({ NODE_ENV: 'production', UPLOAD_DIR: '/app/uploads' })
    ).toBe('/app/uploads');
  });

  it('prerenders no pages at build time', () => {
    expect(renderOnFirstRequest()).toEqual([]);
  });
});

describe('search highlights', () => {
  it('keeps only <mark> from highlighted text', () => {
    expect(
      keepMarksOnly(
        '<p onclick="x()">Mleko <mark>krów</mark></p><script>alert(1)</script><style>p{}</style>'
      )
    ).toBe('Mleko <mark>krów</mark>');
  });

  it('treats a missing article body as empty', () => {
    expect(sanitizeArticleHtml(undefined as unknown as string)).toBe('');
  });
});
