import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('settings');

/**
 * Site settings edited in the admin panel. The database only holds what
 * was changed there; everything else falls back to these defaults, so a
 * fresh (empty) production database still renders complete pages.
 */
export const SETTING_DEFAULTS = {
  /** The department office: footer, accessibility statement, privacy policy */
  contact: { email: 'khz@up.poznan.pl', phone: '+48 61 848 72 45' },
  /**
   * Dates of the accessibility statement (YYYY-MM-DD). The Act of 4 April
   * 2019 requires them to be current; the publication date is empty until
   * the site goes live.
   */
  accessibility: {
    published: '',
    lastUpdated: '2026-09-26',
    prepared: '2026-09-26',
    reviewed: '2026-09-26',
  },
  /** Facts in the privacy policy, to be confirmed with the university's DPO */
  privacy: {
    lastUpdated: '2026-09-26',
    controllerAddress: 'ul. Wojska Polskiego 28, 60-637 Poznań',
    dpoEmail: '',
  },
};

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = {
  [K in SettingKey]: Record<keyof (typeof SETTING_DEFAULTS)[K], string>;
};

/** Settings with defaults filled in; cached per request. */
export const getSettings = cache(async (): Promise<Settings> => {
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await prisma.siteSetting.findMany();
  } catch (err) {
    // Rendering must not fail because settings could not be read
    log.error({ err }, 'Could not read settings, using defaults');
  }
  const settings = structuredClone(SETTING_DEFAULTS) as Settings;
  for (const { key, value } of rows) {
    if (!(key in settings) || !value || typeof value !== 'object') continue;
    const target = settings[key as SettingKey] as Record<string, string>;
    for (const [field, fieldValue] of Object.entries(value)) {
      if (field in target && typeof fieldValue === 'string')
        target[field] = fieldValue;
    }
  }
  return settings;
});
