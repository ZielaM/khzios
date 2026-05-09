import style from './NewsTileSkeleton.module.scss';

export default function NewsTileSkeleton() {
  return (
    <div className={style.skeleton}>
      <div className={style.imagePlaceholder} />
      <div className={style.content}>
        <div className={style.tags}>
          <div className={style.tagPlaceholder} />
          <div className={style.tagPlaceholder} />
        </div>
        <div className={style.titlePlaceholder} />
        <div className={style.titlePlaceholderShort} />
        <div className={style.textPlaceholder} />
        <div className={style.textPlaceholder} />
        <div className={style.textPlaceholderShort} />
      </div>
    </div>
  );
}
