// Sanity tests for the PhoneFit recommendation engine (stage-3 data layer).
import {
  PURPOSES,
  BUDGET_TIERS,
  getRecommendations,
  phones,
  scorePhone,
} from './mockDatabase';

describe('recommendation engine', () => {
  it('returns 3–4 matches for every purpose × budget combination', () => {
    PURPOSES.forEach((p) => {
      BUDGET_TIERS.forEach((t) => {
        const { list } = getRecommendations({ purpose: p.key, budget: t.key });
        expect(list.length).toBeGreaterThanOrEqual(3);
        expect(list.length).toBeLessThanOrEqual(4);
      });
    });
  });

  it('ranks matches by purpose score, descending', () => {
    const { list } = getRecommendations({ purpose: 'camera', budget: 'flagship' });
    for (let i = 1; i < list.length; i += 1) {
      expect(list[i - 1].match).toBeGreaterThanOrEqual(list[i].match);
    }
    // The camera leader in the flagship tier should be a top-camera device
    expect(['pixel-9-pro', 'galaxy-s24-ultra', 'iphone-16-pro']).toContain(list[0].phone.id);
  });

  it('keeps all matches inside the requested budget tier', () => {
    const { list } = getRecommendations({ purpose: 'everyday', budget: 'entry' });
    list.forEach((entry) => {
      expect(entry.phone.priceINR).toBeLessThan(20000);
    });
  });

  it('applies OS and size filters when enough matches exist', () => {
    const { list, relaxed } = getRecommendations({
      purpose: 'everyday',
      budget: 'flagship',
      os: 'iOS',
    });
    expect(relaxed).toEqual([]);
    expect(list.length).toBe(3);
    list.forEach((entry) => expect(entry.phone.os).toBe('iOS'));
  });

  it('keeps an honest short list rather than swapping OS for extra matches', () => {
    // Only the iPhone 13 sits in the mid-range tier → 1 match, still all iOS.
    const { list, relaxed } = getRecommendations({
      purpose: 'everyday',
      budget: 'mid',
      os: 'iOS',
    });
    expect(list.length).toBe(1);
    expect(relaxed).toEqual([]);
    expect(list[0].phone.id).toBe('iphone-13');
  });

  it('relaxes OS only when it would otherwise return nothing', () => {
    // No entry-level iOS phones exist in the catalog → OS must be relaxed.
    const { list, relaxed } = getRecommendations({
      purpose: 'gaming',
      budget: 'entry',
      os: 'iOS',
    });
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(relaxed).toContain('OS');
  });

  it('relaxes screen size (soft preference) before anything else', () => {
    // Entry-level + large screen leaves few phones; size should widen first.
    const { list, relaxed } = getRecommendations({
      purpose: 'battery',
      budget: 'entry',
      size: 'large',
    });
    expect(list.length).toBeGreaterThanOrEqual(3);
  });

  it('scores are bounded 0–100 for every phone and purpose', () => {
    phones.forEach((phone) => {
      PURPOSES.forEach((p) => {
        const score = scorePhone(phone, p.key);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  it('every phone has tailored notes for all purposes plus pros & cons', () => {
    phones.forEach((phone) => {
      PURPOSES.forEach((p) => {
        expect(phone.purposeNotes[p.key].length).toBeGreaterThan(0);
      });
      expect(phone.pros.length).toBe(3);
      expect(phone.cons.length).toBe(2);
    });
  });
});
