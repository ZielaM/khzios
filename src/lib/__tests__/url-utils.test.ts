import { describe, it, expect } from 'vitest';
import { computeNextSearchParams } from '../url-utils';

describe('computeNextSearchParams', () => {
  // ─── No-Op (returns null when nothing changed) ─────────────────────

  describe('no-op detection', () => {
    it('should return null when all params are identical', () => {
      const params = new URLSearchParams('query=test&tag=dogs&sort=date');
      const result = computeNextSearchParams(params, 'test', ['dogs'], 'date');
      expect(result).toBeNull();
    });

    it('should return null when everything is empty and stays empty', () => {
      const params = new URLSearchParams('sort=date');
      const result = computeNextSearchParams(params, '', [], 'date');
      expect(result).toBeNull();
    });

    it('should return null when relevance is requested without query (auto-falls back to date)', () => {
      const params = new URLSearchParams('sort=date');
      const result = computeNextSearchParams(params, '', [], 'relevance');
      expect(result).toBeNull();
    });
  });

  // ─── Single Param Changes ──────────────────────────────────────────

  describe('single param changes', () => {
    it('should add a new query, set page to 1', () => {
      const params = new URLSearchParams('page=5&sort=date');
      const result = computeNextSearchParams(params, 'hello', [], 'date');

      expect(result).not.toBeNull();
      expect(result?.get('query')).toBe('hello');
      expect(result?.get('page')).toBe('1');
    });

    it('should update an existing query, reset page to 1', () => {
      const params = new URLSearchParams('query=old&page=3&sort=date');
      const result = computeNextSearchParams(params, 'new', [], 'date');

      expect(result?.get('query')).toBe('new');
      expect(result?.get('page')).toBe('1');
    });

    it('should add tags as comma-separated string', () => {
      const params = new URLSearchParams('sort=date');
      const result = computeNextSearchParams(
        params,
        '',
        ['dogs', 'cats'],
        'date'
      );

      expect(result).not.toBeNull();
      expect(result?.get('tag')).toBe('dogs,cats');
    });

    it('should update existing tags', () => {
      const params = new URLSearchParams('tag=dogs&sort=date');
      const result = computeNextSearchParams(params, '', ['cats'], 'date');

      expect(result?.get('tag')).toBe('cats');
    });

    it('should remove tags when empty array is provided', () => {
      const params = new URLSearchParams('tag=dogs,cats&sort=date');
      const result = computeNextSearchParams(params, '', [], 'date');

      expect(result).not.toBeNull();
      expect(result?.has('tag')).toBe(false);
    });

    it('should preserve unrelated params when changes occur', () => {
      const params = new URLSearchParams(
        'query=old&customParam=keepMe&sort=date'
      );
      const result = computeNextSearchParams(params, 'new', [], 'date');

      expect(result?.get('customParam')).toBe('keepMe');
      expect(result?.get('query')).toBe('new');
    });
  });

  // ─── Sort ↔ Query Coupling ────────────────────────────────────────
  // Business rule: relevance sorting requires a text query.
  // If query is empty, sort always falls back to 'date'.

  describe('sort ↔ query coupling', () => {
    it('should apply relevance sorting when query exists', () => {
      const params = new URLSearchParams('query=test&sort=date');
      const result = computeNextSearchParams(params, 'test', [], 'relevance');

      expect(result).not.toBeNull();
      expect(result?.get('sort')).toBe('relevance');
    });

    it('should force date sorting when query is empty even if relevance is requested', () => {
      const params = new URLSearchParams('sort=relevance');
      const result = computeNextSearchParams(params, '', [], 'relevance');

      expect(result).not.toBeNull();
      expect(result?.get('sort')).toBe('date');
    });

    it('should remove query and switch sort to date simultaneously', () => {
      const params = new URLSearchParams(
        'query=hello&page=2&sort=relevance'
      );
      const result = computeNextSearchParams(params, '', [], 'relevance');

      expect(result).not.toBeNull();
      expect(result?.has('query')).toBe(false);
      expect(result?.get('sort')).toBe('date');
      expect(result?.get('page')).toBe('1');
    });
  });

  // ─── Combined Scenarios ────────────────────────────────────────────

  describe('combined scenarios', () => {
    it('should handle simultaneous query + tags + sort change', () => {
      const params = new URLSearchParams('');
      const result = computeNextSearchParams(
        params,
        'zwierzęta',
        ['psy', 'koty'],
        'relevance'
      );

      expect(result).not.toBeNull();
      expect(result?.get('query')).toBe('zwierzęta');
      expect(result?.get('tag')).toBe('psy,koty');
      expect(result?.get('sort')).toBe('relevance');
      expect(result?.get('page')).toBe('1');
    });

    it('should handle clearing everything at once', () => {
      const params = new URLSearchParams(
        'query=old&tag=dogs&sort=relevance&page=5'
      );
      const result = computeNextSearchParams(params, '', [], 'date');

      expect(result).not.toBeNull();
      expect(result?.has('query')).toBe(false);
      expect(result?.has('tag')).toBe(false);
      expect(result?.get('sort')).toBe('date');
      expect(result?.get('page')).toBe('1');
    });
  });
});
