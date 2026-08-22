import { prisma } from '@/lib/prisma';
import NewsTile from '@/components/NewsTile';
import styles from './RecentNews.module.scss';

export default async function RecentNewsServer({ locale }: { locale: string }) {
  const news = await prisma.news.findMany({
    take: 3,
    where: { published: true },
    include: {
      tags: { include: { translations: true } },
      photos: true,
      translations: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.grid}>
      {news.map((item, index) => (
        <NewsTile
          key={item.id}
          news={item}
          locale={locale}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
