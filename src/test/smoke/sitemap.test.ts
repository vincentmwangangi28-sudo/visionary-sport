import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('sitemap', () => {
  it('public/sitemap.xml exists', () => {
    const p = path.resolve(process.cwd(), 'public', 'sitemap.xml');
    expect(fs.existsSync(p)).toBe(true);
  });
});
