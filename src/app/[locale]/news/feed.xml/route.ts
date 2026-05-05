import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as 'pl' | 'en' | 'uk' | 'ru';

  const t = await getTranslations({ locale, namespace: 'NewsPage' });

  const news = await prisma.news.findMany({
    where: {
      published: true,
      translations: {
        some: { languageCode: locale },
      },
    },
    include: {
      translations: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'https://khzios.up.poznan.pl';

  const feedItems = news
    .map((item) => {
      const translation =
        item.translations.find((t) => t.languageCode === locale) ||
        item.translations[0];
      const url = `${baseUrl}/${locale}/news/${item.id}`;

      // Proste usuwanie tagów HTML z kontentu dla bezpieczeństwa i czytelności RSS
      const cleanContent = translation.content.replace(/<[^>]*>?/gm, '');

      return `
      <item>
        <title><![CDATA[${translation.title}]]></title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${new Date(item.createdAt).toUTCString()}</pubDate>
        <description><![CDATA[${cleanContent}]]></description>
      </item>
    `;
    })
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title><![CDATA[${t('title')} - KHZiOS]]></title>
        <link>${baseUrl}/${locale}/news</link>
        <description><![CDATA[${t('title')}]]></description>
        <language>${locale}</language>
        ${feedItems}
      </channel>
    </rss>
  `;

  return new Response(feed.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
