import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import style from './forms.module.scss';

/** Up and down buttons that move an item in a list (e.g. photos). */
export default function MoveButtons({
  action,
  idField,
  id,
  index,
  count,
}: {
  action: (formData: FormData) => Promise<void>;
  /** Name of the hidden field the action reads the item's id from */
  idField: string;
  id: string;
  index: number;
  count: number;
}) {
  if (count < 2) return null;
  return (
    <>
      {(['up', 'down'] as const).map((direction) => {
        const Icon = direction === 'up' ? ChevronUp : ChevronDown;
        return (
          <form key={direction} action={action}>
            <input type="hidden" name={idField} value={id} />
            <input type="hidden" name="direction" value={direction} />
            <button
              type="submit"
              className={clsx(style.button, style.secondary, style.iconButton)}
              disabled={direction === 'up' ? index === 0 : index === count - 1}
              aria-label={`Przesuń zdjęcie ${index + 1} ${direction === 'up' ? 'wyżej' : 'niżej'}`}
            >
              <Icon aria-hidden="true" size={18} />
            </button>
          </form>
        );
      })}
    </>
  );
}
