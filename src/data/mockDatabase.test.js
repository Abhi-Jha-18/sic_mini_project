import {
  BUDGET_TIERS,
  DATASET_META,
  PURPOSES,
  getRecommendations,
  phones,
  purposeNotesFor,
  scorePhone,
  sizeOf,
  tierOf,
} from './mockDatabase';

describe('client-provided phone dataset and recommendation engine', () => {
  it('loads all 413 client records with source prices and localized INR prices', () => {
    expect(DATASET_META).toEqual({
      source: 'data/sic_mobile_spec_PJ1 - Sheet1.csv',
      sourceCurrency: 'USD',
      currency: 'INR',
      usdToInrRate: 95.13,
      conversionDate: '2026-10-28',
      recordCount: 413,
    });
    expect(phones).toHaveLength(413);
    expect(phones[0]).toMatchObject({
      id: 'client-001',
      name: 'Voltix Hyper67 5G (256 GB)',
      priceUSD: 1000,
      priceINR: 95130,
      cameraMP: 200,
      storageGB: 256,
    });
    expect(phones.at(-1)).toMatchObject({
      id: 'client-413',
      name: 'Celesto Note48 SE (128 GB)',
      priceUSD: 170,
      priceINR: 16172,
      cameraMP: 0,
    });
    expect(phones.every((phone) => !('os' in phone))).toBe(true);
  });

  it('defines Indian-rupee budget tiers using converted prices', () => {
    expect(BUDGET_TIERS.map((tier) => tier.range)).toEqual([
      'Under ₹20,000', '₹20,000 – ₹50,000', 'Above ₹50,000',
    ]);
    phones.forEach((phone) => {
      const tier = BUDGET_TIERS.find((candidate) => candidate.matches(phone));
      expect(tier.key).toBe(tierOf(phone));
    });
    expect(phones.some((phone) => phone.priceUSD === 1000)).toBe(true);
    phones.forEach((phone) => {
      expect(phone.priceINR).toBe(Math.round(phone.priceUSD * DATASET_META.usdToInrRate));
    });
  });

  it('returns a ranked shortlist for every purpose and budget tier', () => {
    PURPOSES.forEach((purpose) => {
      BUDGET_TIERS.forEach((tier) => {
        const { list } = getRecommendations({ purpose: purpose.key, budget: tier.key });
        expect(list.length).toBeGreaterThanOrEqual(3);
        expect(list.length).toBeLessThanOrEqual(4);
        for (let i = 1; i < list.length; i += 1) {
          expect(list[i - 1].match).toBeGreaterThanOrEqual(list[i].match);
        }
        list.forEach(({ phone }) => expect(tier.matches(phone)).toBe(true));
      });
    });
  });

  it('supports top-pick limits and full-catalog browsing', () => {
    const top = getRecommendations({ purpose: 'camera', budget: 'mid' });
    const complete = getRecommendations({ purpose: 'camera', budget: 'mid', limit: Infinity });
    expect(top.list).toHaveLength(4);
    expect(complete.list.length).toBeGreaterThan(4);
    expect(complete.list.length).toBe(phones.filter((phone) => BUDGET_TIERS[1].matches(phone)).length);
  });

  it('uses the selected need to surface corresponding client-supplied values', () => {
    const phone = phones[0];
    expect(purposeNotesFor(phone).camera).toContain('200 MP camera listing');
    expect(purposeNotesFor(phone).gaming).toContain('4 GB RAM listed');
    expect(purposeNotesFor(phone).battery).toContain('4,700 mAh battery listed');
  });

  it('applies screen-size filtering and widens the filter when too few results remain', () => {
    const { list } = getRecommendations({ purpose: 'camera', budget: 'mid', size: 'compact' });
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.every(({ phone }) => phone.screenInches <= 6.3)).toBe(true);

    const sparse = getRecommendations({ purpose: 'battery', budget: 'flagship', size: 'compact' });
    expect(sparse.list.length).toBeGreaterThanOrEqual(3);
    expect(sparse.relaxed).toContain('screen size');
  });

  it.each(['compact', 'standard', 'large'])('returns only %s phones for that size unless the filter was relaxed', (size) => {
    const { list, relaxed } = getRecommendations({ purpose: 'media', budget: 'mid', size, limit: Infinity });
    expect(list.length).toBeGreaterThan(0);
    if (relaxed.length === 0) {
      list.forEach(({ phone }) => expect(sizeOf(phone)).toBe(size));
    }
  });

  it('falls back to everyday scoring and never returns NaN for incomplete records', () => {
    const incomplete = { ...phones[0], rating: undefined, cameraMP: null };
    expect(scorePhone(incomplete, 'camera')).toBe(0);
    expect(Number.isNaN(scorePhone(incomplete, 'unknown-purpose'))).toBe(false);
  });

  it('keeps all heuristic scores within 0–100 for every record and need', () => {
    phones.forEach((phone) => {
      PURPOSES.forEach((purpose) => {
        expect(scorePhone(phone, purpose.key)).toBeGreaterThanOrEqual(0);
        expect(scorePhone(phone, purpose.key)).toBeLessThanOrEqual(100);
      });
    });
  });

  it('does not invent missing operating systems, processors, or camera details', () => {
    expect(phones.every((phone) => !('os' in phone))).toBe(true);
    expect(phones.some((phone) => phone.processor === null)).toBe(true);
    expect(phones.some((phone) => phone.cameraMP === 0)).toBe(true);
  });
});