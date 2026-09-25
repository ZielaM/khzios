import { describe, it, expect } from 'vitest';
import { memberHref, teamHref, teamSlugFor } from '../team-routes';

const team = {
  slug: 'ruminants',
  translations: [
    { languageCode: 'pl', slug: 'przezuwajace' },
    { languageCode: 'en', slug: 'ruminants' },
  ],
};

describe('team routes', () => {
  it('uses the slug of the requested language', () => {
    expect(teamSlugFor(team, 'pl')).toBe('przezuwajace');
  });

  it('follows the translation fallback chain', () => {
    expect(teamSlugFor(team, 'uk')).toBe('ruminants');
  });

  it('falls back to the canonical slug without translations', () => {
    expect(teamSlugFor({ slug: 'swine', translations: [] }, 'pl')).toBe(
      'swine'
    );
  });

  it('builds typed hrefs for team and member pages', () => {
    expect(teamHref(team, 'pl')).toEqual({
      pathname: '/about-us/structure/[team]',
      params: { team: 'przezuwajace' },
    });
    expect(memberHref(team, 'pl', 'anna-kowalska')).toEqual({
      pathname: '/about-us/structure/[team]/[member]',
      params: { team: 'przezuwajace', member: 'anna-kowalska' },
    });
  });
});
