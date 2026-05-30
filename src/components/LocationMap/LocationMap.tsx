import style from './LocationMap.module.scss';
import AnimateOnce from '@/components/AnimateOnce';

export default function LocationMap() {
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2432.799346733316!2d16.905802454596714!3d52.42843329894159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470444af4b46fdfb%3A0x5e14cbe22a9b8dd8!2sSzyd%C5%82owska%2050%2C%2060-656%20Pozna%C5%84!5e0!3m2!1spl!2spl!4v1780150245371!5m2!1spl!2spl`;

  return (
    <AnimateOnce>
      <div className={style.mapContainer}>
        <iframe
          src={mapUrl}
          className={style.iframe}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Map location"
        />
      </div>
    </AnimateOnce>
  );
}
