import { Link } from '@/i18n/routing';
import style from './NavItem.module.scss';

export default function NavItem({
  label,
  href,
  onClick,
}: {
  label: string;
  href: React.ComponentProps<typeof Link>['href'];
  onClick?: () => void;
}) {
  return (
    <Link href={href} className={style.navLink} onClick={onClick}>
      {label}
    </Link>
  );
}
