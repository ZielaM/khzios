import styles from './page.module.scss';
import { prisma } from '@/lib/prisma';
import NewsTile from '@/components/NewsTile';

export default async function Home() {
  const news = await prisma.news.findMany({
    take: 3,
    where: { published: true },
    include: { tags: true, photos: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {news.map((item) => (
            <NewsTile key={item.id} news={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
