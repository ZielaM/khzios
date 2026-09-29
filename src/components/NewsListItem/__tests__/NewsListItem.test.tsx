import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewsListItem from '../NewsListItem';
import { makeNews, makePhoto } from '@/test/fixtures';

const long = 'Słowo '.repeat(80).trim();
const tags = [
  {
    id: 't1',
    name: 'bydlo',
    translations: [{ tagId: 't1', languageCode: 'pl', name: 'Bydło' }],
  },
];

describe('NewsListItem', () => {
  it('shows the date, the linked title, a summary and the tags', () => {
    render(
      <NewsListItem locale="en" news={makeNews('n1', { tags } as never)} />
    );
    const article = screen.getByRole('article');
    expect(
      within(article).getByRole('heading', { level: 3 })
    ).toHaveTextContent('Article n1');
    expect(
      within(article).getByRole('link', { name: 'Article n1' })
    ).toHaveAttribute('href', '/news/n1');
    expect(within(article).getByText('Content n1')).toBeInTheDocument();
    expect(article.querySelector('time')).toHaveAttribute(
      'dateTime',
      '2026-01-01T10:00:00.000Z'
    );
    expect(within(article).getByRole('listitem')).toHaveTextContent('Bydło');
    // No photo: no thumbnail
    expect(within(article).queryByRole('img', { hidden: true })).toBeNull();
  });

  it('shortens the summary to the length of each variant', () => {
    const news = (id: string) =>
      makeNews(id, {
        translations: [
          {
            newsId: id,
            languageCode: 'en',
            title: id,
            content: `<p>${long}</p>`,
          },
        ],
      });
    const lengthOf = (id: string) =>
      screen
        .getByRole('link', { name: id })
        .closest('article')!
        .querySelector('p:last-of-type')!.textContent!.length;
    render(
      <>
        <NewsListItem locale="en" news={news('regular')} />
        <NewsListItem locale="en" news={news('featured')} featured />
        <NewsListItem locale="en" news={news('compact')} compact />
      </>
    );
    expect(lengthOf('compact')).toBeLessThanOrEqual(111);
    expect(lengthOf('regular')).toBeLessThanOrEqual(181);
    expect(lengthOf('featured')).toBeLessThanOrEqual(241);
    expect(lengthOf('compact')).toBeLessThan(lengthOf('regular'));
    expect(lengthOf('regular')).toBeLessThan(lengthOf('featured'));
  });

  it('keeps search highlights in the title and the summary', () => {
    render(
      <NewsListItem
        locale="en"
        news={makeNews('n1', {
          translations: [
            {
              newsId: 'n1',
              languageCode: 'en',
              title: 'Dairy <mark>cows</mark>',
              content: '… milk of <mark>cows</mark> <script>x()</script>',
            },
          ],
        })}
      />
    );
    const marks = screen.getByRole('article').querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(screen.getByRole('article').querySelector('script')).toBeNull();
  });

  it('says which language is shown when the article is not translated', () => {
    const polishOnly = makeNews('n1', {
      translations: [
        { newsId: 'n1', languageCode: 'pl', title: 'Tytuł', content: 'Treść' },
      ],
    });
    render(<NewsListItem locale="en" news={polishOnly} headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Tytuł'
    );
    expect(screen.getByText(/^translationUnavailable:/)).toHaveTextContent(
      '"language":"polski"'
    );
  });

  it('names an unknown fallback language by its code', () => {
    const odd = makeNews('n1', {
      translations: [
        { newsId: 'n1', languageCode: 'de' as 'pl', title: 'T', content: 'C' },
      ],
    });
    render(<NewsListItem locale="en" news={odd} />);
    expect(screen.getByText(/^translationUnavailable:/)).toHaveTextContent(
      '"language":"de"'
    );
  });

  it('shows a decorative thumbnail, and no tags or summary in the compact variant', () => {
    const news = makeNews('n1', {
      tags,
      photos: [makePhoto('p1', '/media/krowy-0123456789ab.webp')],
      translations: [
        { newsId: 'n1', languageCode: 'en', title: 'T', content: '' },
      ],
    } as never);
    const { container } = render(
      <NewsListItem locale="en" news={news} compact />
    );
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/media/krowy-0123456789ab.webp'
    );
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('shows a larger photo in the featured variant', () => {
    const news = makeNews('n1', {
      photos: [makePhoto('p1', '/media/krowy-0123456789ab.webp')],
    });
    const { container } = render(
      <NewsListItem locale="en" news={news} featured preload />
    );
    expect(container.querySelector('article')).toHaveClass('featured');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/media/krowy-0123456789ab.webp'
    );
  });
});
