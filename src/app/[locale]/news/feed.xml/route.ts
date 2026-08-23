import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { generateRssFeed } from '@/lib/rss';
import { LanguageCode } from '@/types/search-types';
import { createLogger } from '@/lib/logger';

const log = createLogger('rss');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LanguageCode;

  const t = await getTranslations({ locale, namespace: 'NewsPage' });

  try {
    const news = await prisma.news.findMany({
      where: {
        published: true,
      },
      include: {
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'https://khzios.up.poznan.pl';

    const siteTitle = t('title');
    const feed = generateRssFeed(news, locale, baseUrl, siteTitle);

    log.info({ locale, articleCount: news.length }, 'RSS feed generated');

    return new Response(feed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    log.error({ err: error, locale }, 'RSS feed generation failed');
    return new Response('Internal Server Error', { status: 500 });
  }
}
