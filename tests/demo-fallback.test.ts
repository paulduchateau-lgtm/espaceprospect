import { describe, it, expect } from 'vitest';
import {
  matchDemoProfile,
  getDemoResponse,
  getAllDemoProfileKeys,
} from '@/lib/demo-fallback';
import { dashboardDataSchema } from '@/lib/schemas';

describe('matchDemoProfile', () => {
  it('matches kine variants', () => {
    expect(matchDemoProfile('Je suis kine liberal')).toBe('kine-liberal');
    expect(matchDemoProfile('Je suis kiné libéral')).toBe('kine-liberal');
    expect(matchDemoProfile('kinesitherapeute, 35 ans')).toBe('kine-liberal');
  });

  it('matches architecte', () => {
    expect(matchDemoProfile('Je suis architecte independant')).toBe(
      'architecte-independant'
    );
  });

  it('matches infirmiere', () => {
    expect(matchDemoProfile('Je suis infirmiere liberale')).toBe(
      'infirmiere-liberale'
    );
    expect(matchDemoProfile('infirmier liberal')).toBe('infirmiere-liberale');
  });

  it('returns null for unknown professions', () => {
    expect(matchDemoProfile('Je suis boulanger')).toBeNull();
    expect(matchDemoProfile('Hello world')).toBeNull();
  });
});

describe('getDemoResponse', () => {
  it('returns valid data for each profile', () => {
    const keys = getAllDemoProfileKeys();
    for (const key of keys) {
      const response = getDemoResponse(key);
      expect(response).not.toBeNull();
      expect(typeof response!.userMessage).toBe('string');
      expect(typeof response!.assistantMessage).toBe('string');
      expect(response!.dashboard).toBeDefined();
      expect(Array.isArray(response!.dashboard.risks)).toBe(true);
      expect(Array.isArray(response!.dashboard.products)).toBe(true);
    }
  });

  it('returns null for unknown profile key', () => {
    expect(getDemoResponse('boulanger')).toBeNull();
  });
});

describe('demo response dashboards validate against schema', () => {
  const keys = getAllDemoProfileKeys();

  it.each(keys)('dashboard for "%s" validates against dashboardDataSchema', (key) => {
    const response = getDemoResponse(key);
    expect(response).not.toBeNull();
    const result = dashboardDataSchema.safeParse(response!.dashboard);
    if (!result.success) {
      console.error(`Validation errors for ${key}:`, result.error.issues);
    }
    expect(result.success).toBe(true);
  });
});

describe('getAllDemoProfileKeys', () => {
  it('returns 3 keys', () => {
    const keys = getAllDemoProfileKeys();
    expect(keys).toHaveLength(3);
    expect(keys).toContain('kine-liberal');
    expect(keys).toContain('architecte-independant');
    expect(keys).toContain('infirmiere-liberale');
  });
});
