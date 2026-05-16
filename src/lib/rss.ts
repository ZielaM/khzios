import { News, NewsTranslation } from '@/generated/prisma/client';
import { resolveTranslation } from '@/lib/translations';
import { LanguageCode } from '@/types/search-types';

export function generateRssFeed(
  news: (News & { translations: NewsTranslation[] })[],
  locale: LanguageCode,
  baseUrl: string,
  siteTitle: string
): string {
  const feedItems = news
    .map((item) => {
      // Resolve translation for this news
      const { translation: resolved } = resolveTranslation(
        item.translations,
        locale
      );
      const translation = resolved ?? item.translations[0];
      const url = `${baseUrl}/${locale}/news/${item.id}`;

      // Simple HTML tag removal from content for RSS safety and readability
      const cleanContent = translation.content.replace(/<[^>]*>?/gm, '');

      return `
      <item>
        <title><![CDATA[${translation.title.replace(/]]>/g, ']]]]><![CDATA[>')}]]></title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${new Date(item.createdAt).toUTCString()}</pubDate>
        <description><![CDATA[${cleanContent.replace(/]]>/g, ']]]]><![CDATA[>')}]]></description>
      </item>
    `;
    })
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title><![CDATA[${siteTitle.replace(/]]>/g, ']]]]><![CDATA[>')} - KHZiOS]]></title>
        <link>${baseUrl}/${locale}/news</link>
        <description><![CDATA[${siteTitle.replace(/]]>/g, ']]]]><![CDATA[>')}]]></description>
        <language>${locale}</language>
        ${feedItems}
      </channel>
    </rss>
  `;

  return feed.trim();
}
