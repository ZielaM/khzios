import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Globe, Link2 } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/BrandIcons';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import style from './ExternalTeamPage.module.scss';

interface ExternalTeamPageProps {
  team: TeamWithRelations;
  locale: string;
}

type LinkIcon = ComponentType<{ size?: number; className?: string }>;

const ICONS: Record<string, LinkIcon> = {
  globe: Globe,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export default function ExternalTeamPage({
  team,
  locale,
}: ExternalTeamPageProps) {
  const t = useTranslations('TeamPage');
  return (
    <div className={style.container}>
      <div className={style.card}>
        <p className={style.description}>{t('externalRedirect')}</p>

        <div className={style.links}>
          {team.links.map((link) => {
            const { translation } = resolveTranslation(
              link.translations,
              locale
            );
            if (!translation) return null;

            const Icon = ICONS[link.icon] || Link2;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={style.linkButton}
              >
                <Icon className={style.icon} size={20} />
                <span>{translation.label}</span>
                <ExternalLink
                  aria-hidden="true"
                  className={style.externalIcon}
                  size={16}
                />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
