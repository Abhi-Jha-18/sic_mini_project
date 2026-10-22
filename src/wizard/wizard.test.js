// =============================================================================
//  src/wizard/wizard.test.js — PhoneFit logic-layer test suite
//  Covers: plant guarantee (3–4 picks for every input combo), filtering,
//  relaxation transparency, output contract, and the step state machine.
// =============================================================================

import {
  BUDGET_TIERS,
  NEEDS,
  OS_OPTIONS,
  PHONE_CATALOG,
  canAdvance,
  createWizard,
  initialWizardState,
  nextStep,
  normalizeRequirements,
  prevStep,
  recommend,
  reducer,
  refine,
  selectNeed,
  setExactAmount,
  startOver,
  updateRequirements,
  validateStep1,
  validateStep2,
  resolveBudgetWindow,
} from './index.js';

const req = (patch) => normalizeRequirements(patch);

// ── Step-3 engine · exhaustive guarantee ───────────────────────────────────
describe('recommendation engine — output guarantee', () => {
  it('returns 3–4 ranked picks for every need × tier × OS combination', () => {
    NEEDS.forEach(({ key: need }) => {
      BUDGET_TIERS.forEach(({ key: tier }) => {
        OS_OPTIONS.forEach(({ key: os }) => {
          const out = recommend({ need, requirements: req({ budget: { mode: 'tier', tier }, os }) });
          expect(out.count).toBeGreaterThanOrEqual(3);
          expect(out.count).toBeLessThanOrEqual(4);
          expect(out.recommendations.map((r) => r.rank)).toEqual([1, 2, 3, 4].slice(0, out.count));
          for (let i = 1; i < out.recommendations.length; i += 1) {
            expect(out.recommendations[i - 1].matchScore).toBeGreaterThanOrEqual(
              out.recommendations[i].matchScore,
            );
          }
        });
      });
    });
  });

  it('every card satisfies the output contract (identity, price, reason, specs, pros/cons)', () => {
    const { recommendations } = recommend({
      need: 'camera',
      requirements: req({ budget: { mode: 'tier', tier: '1000-plus' } }),
    });
    recommendations.forEach((r) => {
      expect(typeof r.brand).toBe('string');
      expect(typeof r.model).toBe('string');
      expect(['iOS', 'Android']).toContain(r.os);
      expect(r.estimatedPrice.amountUSD).toBeGreaterThan(0);
      expect(r.estimatedPrice.label).toMatch(/^≈ \$/);
      expect(r.primaryFitReason.length).toBeGreaterThan(20);
      expect(Object.keys(r.keySpecs)).toEqual(
        expect.arrayContaining(['processor', 'memory', 'display', 'battery', 'cameras']),
      );
      expect(r.pros.length).toBeGreaterThanOrEqual(2);
      expect(r.pros.length).toBeLessThanOrEqual(3);
      expect(r.cons.length).toBeGreaterThanOrEqual(2);
      expect(r.cons.length).toBeLessThanOrEqual(3);
    });
  });
});

// ── Step-3 engine · filtering & ranking behaviour ──────────────────────────
describe('recommendation engine — behaviour', () => {
  it('keeps un-relaxed results inside the selected budget tier', () => {
    const out = recommend({ need: 'everyday', requirements: req({ budget: { mode: 'tier', tier: '300-600' } }) });
    expect(out.relaxations).toHaveLength(0);
    out.recommendations.forEach((r) => {
      expect(r.estimatedPrice.amountUSD).toBeGreaterThanOrEqual(300);
      expect(r.estimatedPrice.amountUSD).toBeLessThanOrEqual(600);
      expect(r.estimatedPrice.withinSelectedBudget).toBe(true);
    });
  });

  it('honours OS as a hard preference (iOS picks only for iOS tier fits)', () => {
    const out = recommend({
      need: 'gaming',
      requirements: req({ budget: { mode: 'tier', tier: '600-1000' }, os: 'ios' }),
    });
    out.recommendations.forEach((r) => expect(r.os).toBe('iOS'));
    expect(out.recommendations.some((r) => r.id === 'apple-iphone-17')).toBe(true);
  });

  it('respects hard spec floors when a viable pool exists', () => {
    const out = recommend({
      need: 'gaming',
      requirements: req({
        budget: { mode: 'tier', tier: '600-1000' },
        prioritySpecs: { minRamGB: 12, minBatteryMAh: 5000, minRefreshHz: 144 },
      }),
    });
    expect(out.relaxations).toHaveLength(0);
    out.recommendations.forEach((r) => {
      expect(r.keySpecs.battery).toMatch(/mAh/);
      expect(PHONE_CATALOG.find((p) => p.id === r.id).ramGB).toBeGreaterThanOrEqual(12);
      expect(PHONE_CATALOG.find((p) => p.id === r.id).display.refreshHz).toBeGreaterThanOrEqual(144);
    });
  });

  it('drops impossible constraints with transparent relaxation notes', () => {
    const out = recommend({
      need: 'battery',
      requirements: req({
        budget: { mode: 'tier', tier: 'under-300' },
        prioritySpecs: { minBatteryMAh: 7000 }, // nothing under $300 has 7,000 mAh
      }),
    });
    expect(out.count).toBeGreaterThanOrEqual(3);
    expect(out.relaxations.some((r) => r.constraint === 'minBatteryMAh')).toBe(true);
  });

  it('reports a budget stretch when a platform has nothing in range (iOS < $300)', () => {
    const out = recommend({
      need: 'everyday',
      requirements: req({ budget: { mode: 'tier', tier: 'under-300' }, os: 'ios' }),
    });
    expect(out.count).toBeGreaterThanOrEqual(3);
    expect(out.relaxations.some((r) => r.constraint === 'budget')).toBe(true);
    expect(out.recommendations[0].id).toBe('apple-iphone-17e'); // cheapest iPhone wins the stretch
    out.recommendations.forEach((r) => expect(r.estimatedPrice.withinSelectedBudget).toBe(false));
  });

  it('exact-budget mode caps prices within the 5% grace band', () => {
    const out = recommend({
      need: 'display',
      requirements: req({ budget: { mode: 'exact', amount: 800 } }),
    });
    expect(out.relaxations).toHaveLength(0);
    out.recommendations.forEach((r) =>
      expect(r.estimatedPrice.amountUSD).toBeLessThanOrEqual(Math.round(800 * 1.05)),
    );
  });

  it('ranks need-appropriate leaders first', () => {
    const leadId = (need, tier) =>
      recommend({ need, requirements: req({ budget: { mode: 'tier', tier } }) }).recommendations[0].id;

    expect(['redmagic-11-pro', 'iqoo-15', 'oneplus-15']).toContain(leadId('gaming', '600-1000'));
    expect(['samsung-galaxy-s26-ultra', 'apple-iphone-17-pro-max', 'xiaomi-17-ultra']).toContain(
      leadId('camera', '1000-plus'),
    );
    expect(['oneplus-15', 'redmagic-11-pro', 'iqoo-15']).toContain(leadId('battery', '600-1000'));
    expect(['cmf-phone-2-pro', 'samsung-galaxy-a36']).toContain(leadId('camera', 'under-300'));
  });

  it('a relaxed must-have still wins: the only telephoto under $600 tops the list', () => {
    const out = recommend({
      need: 'camera',
      requirements: req({
        budget: { mode: 'tier', tier: '300-600' },
        prioritySpecs: { cameraSetup: 'telephoto' },
      }),
    });
    // Only the Nothing Phone (4a) Pro has a telephoto in $300–600, so the
    // constraint relaxes (fewer than 3) — but the compliant phone must lead.
    expect(out.relaxations.some((r) => r.constraint === 'cameraSetup')).toBe(true);
    expect(out.recommendations[0].id).toBe('nothing-phone-4a-pro');
    expect(out.recommendations[0].primaryFitReason).toMatch(/optical zoom/);
  });
});

// ── Step-2 input handling ──────────────────────────────────────────────────
describe('input normalisation & validation', () => {
  it('normalizeRequirements fills defaults and coerces types', () => {
    const n = normalizeRequirements({ budget: { mode: 'exact', amount: '750' }, prioritySpecs: { minRamGB: '8' } });
    expect(n.budget.amount).toBe(750);
    expect(n.prioritySpecs.minRamGB).toBe(8);
    expect(n.prioritySpecs.cameraSetup).toBe('any');
    expect(n.os).toBe('any');
  });

  it('resolveBudgetWindow maps tiers and exact amounts with grace', () => {
    expect(resolveBudgetWindow(req({ budget: { mode: 'tier', tier: '600-1000' } }).budget)).toMatchObject({
      min: 601, max: 1000,
    });
    expect(resolveBudgetWindow(req({ budget: { mode: 'exact', amount: 500 } }).budget).max).toBe(525);
  });

  it('validators reject bad input with targeted messages', () => {
    expect(validateStep1(null).need).toBeTruthy();
    expect(validateStep1('hacking')).toHaveProperty('need');
    expect(validateStep1('camera')).toEqual({});
    expect(validateStep2({ budget: { mode: 'tier', tier: null }, os: 'any' })).toHaveProperty('budgetTier');
    expect(validateStep2({ budget: { mode: 'exact', amount: 10 }, os: 'any' })).toHaveProperty('budgetAmount');
    expect(
      validateStep2({ budget: { mode: 'tier', tier: '300-600' }, prioritySpecs: { minRamGB: 99 }, os: 'any' }),
    ).toHaveProperty('minRamGB');
  });
});

// ── Step state machine ─────────────────────────────────────────────────────
describe('wizard state machine', () => {
  const requirementsFor = (tier) => normalizeRequirements({ budget: { mode: 'tier', tier } });
  const drivenThrough = () => {
    let s = initialWizardState;
    s = reducer(s, selectNeed('gaming'));
    s = reducer(s, nextStep());
    s = reducer(s, updateRequirements(requirementsFor('600-1000')));
    s = reducer(s, nextStep());
    return s;
  };

  it('walks 1 → 2 → 3 and caches a RecommendationSet', () => {
    const s = drivenThrough();
    expect(s.step).toBe(3);
    expect(s.output.count).toBeGreaterThanOrEqual(3);
    expect(s.output.generatedFor.need).toBe('gaming');
  });

  it('gates NEXT on step validity and reports the offending field', () => {
    let s = reducer(initialWizardState, nextStep()); // no need chosen
    expect(s.step).toBe(1);
    expect(s.validation.need).toBeTruthy();

    s = reducer(s, selectNeed('camera'));
    s = reducer(s, nextStep());
    expect(s.step).toBe(2);
    s = reducer(s, nextStep()); // no budget chosen
    expect(s.step).toBe(2);
    expect(s.validation.budgetTier).toBeTruthy();
  });

  it('pre-fills gaming spec floors as editable defaults', () => {
    const s = reducer(initialWizardState, selectNeed('gaming'));
    expect(s.inputs.requirements.prioritySpecs.minRamGB).toBe(8);
    expect(s.inputs.requirements.prioritySpecs.minRefreshHz).toBe(120);
  });

  it('invalidates cached results when inputs change; BACK/REFINE/START_OVER behave', () => {
    let s = drivenThrough();
    expect(s.output).not.toBeNull();

    s = reducer(s, refine()); // Step 3 → Step 2, inputs preserved
    expect(s.step).toBe(2);
    expect(s.inputs.need).toBe('gaming');

    s = reducer(s, updateRequirements({ os: 'ios' })); // change → output invalidated
    expect(s.output).toBeNull();

    s = reducer(s, setExactAmount(1200));
    expect(s.inputs.requirements.budget).toMatchObject({ mode: 'exact', amount: 1200 });

    s = reducer(s, prevStep());
    expect(s.step).toBe(1);

    s = reducer(s, startOver());
    expect(s).toEqual(initialWizardState);
  });

  it('canAdvance mirrors the validators', () => {
    expect(canAdvance(initialWizardState)).toBe(false);
    const s2 = reducer(initialWizardState, selectNeed('battery'));
    expect(canAdvance(s2)).toBe(true);
  });

  it('createWizard store dispatches and notifies subscribers', () => {
    const w = createWizard();
    const seen = [];
    const unsub = w.subscribe((s) => seen.push(s.step));
    w.dispatch(selectNeed('everyday'));
    w.dispatch(nextStep());
    w.dispatch(updateRequirements(normalizeRequirements({ budget: { tier: 'under-300' } })));
    w.dispatch(nextStep());
    expect(w.getState().step).toBe(3);
    expect(seen).toEqual([1, 2, 2, 3]);
    unsub();
  });
});
