import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { hasRole, requireUser } from '@/lib/admin/session';
import { TRASH_ENTITIES } from '@/lib/admin/restore';
import { TRASH_DAYS, trashDaysLeft } from '@/lib/admin/trash';
import { purgeTrash, restoreTrashItem } from '../../_actions/trash';
import ActionForm from '../../_components/ActionForm';
import ConfirmButton from '../../_components/ConfirmButton';
import FormMessage from '../../_components/FormMessage';
import style from '../../_components/pages.module.scss';

export const metadata: Metadata = { title: 'Kosz · Panel KHZiOS' };

export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  const user = await requireUser();
  const { restored } = await searchParams;
  // Only known kinds are named, so a crafted link cannot show arbitrary text
  const restoredKind = restored && TRASH_ENTITIES[restored]?.label;
  const items = await prisma.trashItem.findMany({
    orderBy: { deletedAt: 'desc' },
  });

  return (
    <div className={style.page}>
      <h1>Kosz</h1>
      <p className={style.muted}>
        Usunięte elementy można przywrócić przez {TRASH_DAYS} dni; później
        znikają na zawsze razem z plikami, których nic innego nie używa.
      </p>
      {restoredKind && (
        <FormMessage
          message={`Przywrócono (${restoredKind.toLowerCase()}). Element jest znów na swoim miejscu.`}
        />
      )}
      {items.length === 0 && <p className={style.muted}>Kosz jest pusty.</p>}
      {items.map((item) => (
        <section key={item.id} className={style.card} aria-label={item.label}>
          <div className={style.header}>
            <h2>{item.label}</h2>
            <span className={style.badge}>
              {TRASH_ENTITIES[item.entity]?.label ?? item.entity}
            </span>
          </div>
          <p className={style.muted}>
            Usunął(-ęła) {item.deletedBy},{' '}
            {item.deletedAt.toLocaleString('pl-PL', {
              timeZone: 'Europe/Warsaw',
            })}
            . Zostało dni: {trashDaysLeft(item.deletedAt)}.
          </p>
          <div className={style.inlineActions}>
            <ActionForm action={restoreTrashItem} submitLabel="Przywróć">
              <input type="hidden" name="id" value={item.id} />
            </ActionForm>
            {hasRole(user.role, 'ADMIN') && (
              <form action={purgeTrash}>
                <input type="hidden" name="id" value={item.id} />
                <ConfirmButton
                  message={`Usunąć „${item.label}” na zawsze? Tego nie da się cofnąć.`}
                >
                  Usuń na zawsze
                </ConfirmButton>
              </form>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
