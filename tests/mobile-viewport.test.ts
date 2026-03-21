import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Mobile viewport static source verification', () => {
  const splitPanelPath = path.resolve(__dirname, '../src/components/layout/SplitPanel.tsx');
  const pagePath = path.resolve(__dirname, '../src/app/page.tsx');

  describe('SplitPanel.tsx', () => {
    const content = readFileSync(splitPanelPath, 'utf-8');

    it('uses h-dvh for mobile-safe full-height layouts', () => {
      expect(content).toContain('h-dvh');
    });

    it('does not use h-screen (replaced by h-dvh)', () => {
      expect(content).not.toContain('h-screen');
    });
  });

  describe('page.tsx', () => {
    const content = readFileSync(pagePath, 'utf-8');

    it('does not use max-w-[200px] on suggestion chips', () => {
      expect(content).not.toContain('max-w-[200px]');
    });

    it('has min-w-0 for prospect URL banner overflow prevention', () => {
      expect(content).toContain('min-w-0');
    });

    it('uses 44px submit button for tap target compliance', () => {
      expect(content).toContain('width: 44');
      expect(content).toContain('height: 44');
    });

    it('uses responsive max-width for message bubbles', () => {
      expect(content).toContain('min(75%, 480px)');
    });
  });
});
