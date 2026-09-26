import pl from '../../../messages/pl.json';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import ru from '../../../messages/ru.json';

type Messages = Record<string, Record<string, unknown>>;

/** The texts from messages/*.json, before any change made in the panel. */
export const defaultMessages: Record<'pl' | 'en' | 'uk' | 'ru', Messages> = {
  pl,
  en,
  uk,
  ru,
};
