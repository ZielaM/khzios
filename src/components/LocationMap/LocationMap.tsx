import { useTranslations } from 'next-intl';
import AnimateOnce from '@/components/AnimateOnce';
import MapEmbed from './MapEmbed';
import style from './LocationMap.module.scss';

export default function LocationMap() {
  const t = useTranslations('ContactPage');
  const tFooter = useTranslations('Footer');

  return (
    <AnimateOnce>
      <div className={style.mapContainer}>
        <MapEmbed
          labels={{
            title: t('mapTitle'),
            address: tFooter('address'),
            notice: t('mapNotice'),
            show: t('mapShow'),
            openExternal: t('mapOpenExternal'),
            newTab: t('opensInNewTab'),
          }}
        />
      </div>
    </AnimateOnce>
  );
}
