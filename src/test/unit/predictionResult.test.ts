import { describe, it, expect } from 'vitest';
type O = 'Home Win'|'Away Win'|'Draw'|null;
function deriveResult(status: string, hg: number|null, ag: number|null): O {
  if (!['FT','AET','PEN'].includes(status)) return null;
  const h = hg??0, a = ag??0;
  if (h>a) return 'Home Win'; if (a>h) return 'Away Win'; return 'Draw';
}
describe('deriveResult', () => {
  it('home win', () => expect(deriveResult('FT',2,0)).toBe('Home Win'));
  it('away win', () => expect(deriveResult('FT',1,3)).toBe('Away Win'));
  it('draw', () => expect(deriveResult('FT',1,1)).toBe('Draw'));
  it('in progress = null', () => expect(deriveResult('1H',1,0)).toBeNull());
});
