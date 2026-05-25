import { useTranslations } from 'next-intl';
import {
  ExternalLink,
  Globe,
  Facebook,
  Instagram,
  Link2,
  LucideIcon,
} from 'lucide-react';
import { TeamWithRelations } from '@/lib/team-queries';
import { resolveTranslation } from '@/lib/translations';
import style from './ExternalTeamPage.module.scss';
import DOMPurify from 'isomorphic-dompurify';

interface ExternalTeamPageProps {
  team: TeamWithRelations;
  locale: string;
}

const ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  facebook: Facebook,
  instagram: Instagram,
};

export default function ExternalTeamPage({
  team,
  locale,
}: ExternalTeamPageProps) {
  const t = useTranslations('TeamPage');
  const { translation: teamTranslation } = resolveTranslation(
    team.translations,
    locale
  );

  const title = teamTranslation?.name || team.slug;

  return (
    <div className={style.container}>
      <div className={style.card}>
        <h1
          className={style.title}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
        />

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
                <ExternalLink className={style.externalIcon} size={16} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
