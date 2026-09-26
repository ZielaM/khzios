'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import style from './LocationMap.module.scss';

const EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2432.799346733316!2d16.905802454596714!3d52.42843329894159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470444af4b46fdfb%3A0x5e14cbe22a9b8dd8!2sSzyd%C5%82owska%2050%2C%2060-656%20Pozna%C5%84!5e0!3m2!1spl!2spl!4v1780150245371!5m2!1spl!2spl';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Szyd%C5%82owska%2050%2C%2060-656%20Pozna%C5%84';

export interface MapEmbedLabels {
  title: string;
  address: string;
  notice: string;
  show: string;
  openExternal: string;
  newTab: string;
}

/**
 * The Google Maps iframe loads only after the visitor asks for it: until
 * then nothing (not even the IP address) is sent to Google, so the page
 * needs no consent banner.
 */
export default function MapEmbed({ labels }: { labels: MapEmbedLabels }) {
  const [shown, setShown] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The button disappears on click; keep keyboard focus in this spot
  useEffect(() => {
    if (shown) iframeRef.current?.focus();
  }, [shown]);

  if (shown) {
    return (
      <iframe
        ref={iframeRef}
        src={EMBED_URL}
        className={style.iframe}
        title={labels.title}
      />
    );
  }

  return (
    <div className={style.placeholder}>
      <MapPin aria-hidden="true" size={36} className={style.pin} />
      <p className={style.address}>{labels.address}</p>
      <p className={style.notice}>{labels.notice}</p>
      <div className={style.actions}>
        <button
          type="button"
          className={style.showButton}
          onClick={() => setShown(true)}
        >
          {labels.show}
        </button>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={style.externalLink}
        >
          {labels.openExternal}
          <ExternalLink aria-hidden="true" size={16} />
          <span className={style.visuallyHidden}>{labels.newTab}</span>
        </a>
      </div>
    </div>
  );
}
