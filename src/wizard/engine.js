// =============================================================================
//  src/wizard/engine.js — PhoneFit recommendation engine (pure logic)
//
//  The engine is a pipeline of pure functions:
//
//    normalizeRequirements  → coerce/complete the raw Step-2 payload
//    resolveBudgetWindow    → tier key or exact amount → { min, max } window
//    constraintChecks       → ordered, individually-relaxable hard filters
//    rankCandidates         → need-weighted scoring + preference bonuses
//    recommend(inputs)      → relax-until-3, take top 4, dress output cards
//
//  No UI, no globals, no mutation of the catalog. Every function is safe to
//  call from a React component, a reducer, a test, or a Node script.
// =============================================================================

import {
  BUDGET_TIERS,
  CHIPSET_OPTIONS,
  EXACT_BUDGET_GRACE,
  NEED_WEIGHTS,
  OS_OPTIONS,
  RESULTS_MAX,
  RESULTS_MIN,
  isValidNeed,
  isValidOS,
  isValidTier,
} from './config.js';
import { CATALOG_META, PHONE_CATALOG } from './catalog.js';

// ───────────────────────────── input shaping ───────────────────────────────

export const DEFAULT_REQUIREMENTS = {
  budget: { mode: 'tier', tier: null, amount: null },
  prioritySpecs: {
    minRamGB: null,
    minStorageGB: null,
    minBatteryMAh: null,
    minRefreshHz: null,
    chipsetPreference: 'any',
    cameraSetup: 'any',
  },
  os: 'any',
};

/**
 * Merge a possibly-partial Step-2 payload over the defaults and coerce types.
 * Unknown/blank values degrade to "no constraint" instead of throwing.
 */
export function normalizeRequirements(raw = {}) {
  const specs = { ...DEFAULT_REQUIREMENTS.prioritySpecs, ...(raw.prioritySpecs || {}) };
  return {
    budget: {
      mode: raw.budget?.mode === 'exact' ? 'exact' : 'tier',
      tier: isValidTier(raw.budget?.tier) ? raw.budget.tier : DEFAULT_REQUIREMENTS.budget.tier,
      amount: Number.isFinite(+raw.budget?.amount) ? Math.round(+raw.budget.amount) : null,
    },
    prioritySpecs: {
      minRamGB: numOrNull(specs.minRamGB),
      minStorageGB: numOrNull(specs.minStorageGB),
      minBatteryMAh: numOrNull(specs.minBatteryMAh),
      minRefreshHz: numOrNull(specs.minRefreshHz),
      chipsetPreference: CHIPSET_OPTIONS.some((c) => c.key === specs.chipsetPreference)
        ? specs.chipsetPreference
        : 'any',
      cameraSetup: ['any', 'telephoto', 'ois'].includes(specs.cameraSetup)
        ? specs.cameraSetup
        : 'any',
    },
    os: isValidOS(raw.os) ? raw.os : 'any',
  };
}

const numOrNull = (v) => (Number.isFinite(+v) && +v > 0 ? +v : null);

/** Convert the step-2 budget choice into a concrete { min, max } window. */
export function resolveBudgetWindow(budget) {
  if (budget.mode === 'exact' && budget.amount) {
    return {
      mode: 'exact',
      min: 0,
      max: Math.round(budget.amount * (1 + EXACT_BUDGET_GRACE)),
      label: `Around $${budget.amount.toLocaleString('en-US')}`,
      amount: budget.amount,
    };
  }
  const tier = BUDGET_TIERS.find((t) => t.key === budget.tier) || BUDGET_TIERS[1];
  return {
    mode: 'tier',
    min: tier.min,
    max: tier.max,
    label: tier.label,
    tier: tier.key,
  };
}

const withinWindow = (price, window) =>
  price >= window.min && (window.max === null || price <= window.max);

// ─────────────────────────── constraint system ─────────────────────────────

/**
 * Hard constraints, listed in RELAXATION ORDER — the engine drops them
 * bottom-first... actually top-down here: `cameraSetup` is the first to be
 * sacrificed, budget the last. `os` is deliberately absent: it never relaxes
 * while at least one phone honours it (see recommend()).
 */
export const CONSTRAINT_CHECKS = [
  {
    key: 'cameraSetup',
    isActive: (req) => req.prioritySpecs.cameraSetup !== 'any',
    label: (req) =>
      req.prioritySpecs.cameraSetup === 'telephoto'
        ? 'must have a telephoto lens'
        : 'must have optical stabilisation',
    pass: (p, req) =>
      req.prioritySpecs.cameraSetup === 'telephoto' ? p.cameras.telephotoZoom > 0 : p.cameras.rear.some((c) => c.ois),
  },
  {
    key: 'minRefreshHz',
    isActive: (req) => req.prioritySpecs.minRefreshHz !== null,
    label: (req) => `${req.prioritySpecs.minRefreshHz} Hz or faster display`,
    pass: (p, req) => p.display.refreshHz >= req.prioritySpecs.minRefreshHz,
  },
  {
    key: 'minBatteryMAh',
    isActive: (req) => req.prioritySpecs.minBatteryMAh !== null,
    label: (req) => `at least ${req.prioritySpecs.minBatteryMAh} mAh battery`,
    pass: (p, req) => p.battery.mAh >= req.prioritySpecs.minBatteryMAh,
  },
  {
    key: 'minStorageGB',
    isActive: (req) => req.prioritySpecs.minStorageGB !== null,
    label: (req) => `at least ${req.prioritySpecs.minStorageGB} GB storage`,
    pass: (p, req) => p.storageGB >= req.prioritySpecs.minStorageGB,
  },
  {
    key: 'minRamGB',
    isActive: (req) => req.prioritySpecs.minRamGB !== null,
    label: (req) => `at least ${req.prioritySpecs.minRamGB} GB RAM`,
    pass: (p, req) => p.ramGB >= req.prioritySpecs.minRamGB,
  },
];

const osPass = (p, req) => req.os === 'any' || p.os === req.os;

/** Which priority-spec constraints does this phone actually satisfy? */
export const matchedConstraints = (p, req) =>
  CONSTRAINT_CHECKS.filter((c) => c.isActive(req) && c.pass(p, req)).map((c) => c.label(req));

// ──────────────────────────────── scoring ──────────────────────────────────

/**
 * Composite 0–100 fit score for one phone:
 *   need-weighted attribute blend (0–100)
 *   + chipset-preference bonus          (+6, soft want → never a hard filter)
 *   + exact-budget efficiency bonus     (≤+4, exact mode → rewards spending well)
 * Capped at 99.
 */
export function scorePhone(phone, need, req) {
  const weights = NEED_WEIGHTS[need] || NEED_WEIGHTS.everyday;
  const base = Object.entries(weights).reduce(
    (sum, [attr, w]) => sum + w * phone.scores[attr],
    0,
  );

  let bonus = 0;
  if (
    req.prioritySpecs.chipsetPreference !== 'any' &&
    phone.chipset.family === req.prioritySpecs.chipsetPreference
  ) {
    bonus += 6;
  }
  if (req.budget.mode === 'exact' && req.budget.amount) {
    // Peaks when the phone costs 65–100 % of the declared budget.
    const ratio = phone.priceUSD / req.budget.amount;
    bonus += 4 * Math.max(0, Math.min(1, (ratio - 0.45) / 0.55));
  }
  return Math.min(99, Math.round(base + bonus));
}

/**
 * Rank phones by composite fit, applying per-phone `adjustFn` bonuses/
 * penalties (relaxed-constraint compliance, overspend). `sortScore` is
 * unclamped for ordering; the reported `matchScore` is clamped to 30–99 so
 * stretched picks stay honest but never display as broken numbers.
 */
export const rankCandidates = (phones, need, req, adjustFn = () => 0) =>
  phones
    .map((phone) => {
      const sortScore = scorePhone(phone, need, req) + adjustFn(phone);
      return { phone, sortScore, matchScore: Math.max(30, Math.min(99, Math.round(sortScore))) };
    })
    .sort((a, b) => b.sortScore - a.sortScore || a.phone.priceUSD - b.phone.priceUSD);

/** Bonus for still satisfying a constraint that had to be relaxed. */
export const RELAXED_COMPLIANCE_BONUS = 12;
/**
 * Overspend penalty slope: each 100% over the price ceiling costs 60 pts.
 * Uncapped — a $1,199 phone can never outrank a $599 one for a $300 budget,
 * no matter how many stars it has.
 */
export const OVERSPEND_PENALTY_SLOPE = 60;

// ─────────────────────────── output generation ─────────────────────────────

const fmtPrice = (n) => `$${n.toLocaleString('en-US')}`;

const cameraSummary = (p) => {
  const rear = p.cameras.rear
    .map((c) => {
      const zoom = c.role.includes('telephoto') ? `, ${p.cameras.telephotoZoom}x optical` : '';
      return `${c.mp} MP ${c.role.replace('-', ' ')}${c.ois ? ' (OIS)' : ''}${zoom}`;
    })
    .join(' + ');
  return `${rear} · ${p.cameras.frontMp} MP front`;
};

/** Key specifications summary shown on every Step-3 card. */
export const keySpecsOf = (p) => ({
  processor: p.chipset.name,
  memory: `${p.ramGB} GB RAM · ${p.storageGB} GB storage`,
  display: `${p.display.sizeIn}" ${p.display.type} · ${p.display.refreshHz} Hz`,
  battery:
    `${p.battery.mAh.toLocaleString('en-US')} mAh · ${p.battery.wiredW} W wired` +
    (p.battery.wirelessW ? ` · ${p.battery.wirelessW} W wireless` : ''),
  cameras: cameraSummary(p),
});

/**
 * "Primary Fit Reason": one or two sentences saying *why* this phone answers
 * the user's Step-1 need, backed by its strongest concrete specs, then a
 * tie-in to whatever Step-2 constraints it actually honours.
 */
export function buildFitReason(phone, need, req) {
  const perf = `${phone.chipset.name} with ${phone.ramGB} GB RAM`;
  const battery = `${phone.battery.mAh.toLocaleString('en-US')} mAh cell`;
  const charging = `${phone.battery.wiredW} W charging`;
  const display = `${phone.display.sizeIn}" ${phone.display.type} at ${phone.display.refreshHz} Hz`;
  const mainCam = phone.cameras.rear[0];
  const camCore = `${mainCam.mp} MP main camera${mainCam.ois ? ' with OIS' : ''}`;
  const zoom =
    phone.cameras.telephotoZoom > 0 ? ` plus a ${phone.cameras.telephotoZoom}x optical zoom` : '';

  const lead = {
    camera: `Built for photography: ${camCore}${zoom} delivers flagship-grade shots day or night.`,
    gaming: `Built for performance: the ${perf} holds high frame rates in demanding titles without throttling.`,
    battery: `Built for endurance: its ${battery} with ${charging} comfortably outlasts a heavy day.`,
    display: `Built for media: the ${display} is one of the finest panels in this price band.`,
    everyday: `A dependable all-rounder: ${perf}, a ${battery}, and a ${display} — no weak links.`,
  }[need];

  const honours = matchedConstraints(phone, req);
  const chipsetHit =
    req.prioritySpecs.chipsetPreference !== 'any' &&
    phone.chipset.family === req.prioritySpecs.chipsetPreference
      ? ['matches your chipset preference']
      : [];
  const tail = [...honours, ...chipsetHit];
  return tail.length ? `${lead} Also: ${tail.join('; ')}.` : lead;
}

// ─────────────────────────── the recommendation run ────────────────────────

/**
 * recommend({ need, requirements }) → RecommendationSet
 *
 * Contract:
 *  · always 3–4 recommendations for any valid inputs (relaxation guarantees it)
 *  · every card carries: identity, estimatedPrice, primaryFitReason,
 *    keySpecs, 2–3 pros, 2–3 cons, matchScore
 *  · relaxations[] transparently lists every dropped constraint
 */
export function recommend({ need, requirements }, catalog = PHONE_CATALOG) {
  if (!isValidNeed(need)) throw new Error(`Unknown primary need: ${need}`);
  const req = normalizeRequirements(requirements);
  const window = resolveBudgetWindow(req.budget);
  const relaxations = [];
  const catalogMeta = CATALOG_META;

  // Stage 0 — everything hard: budget window + OS + every spec constraint.
  let activeChecks = CONSTRAINT_CHECKS.filter((c) => c.isActive(req));
  let windowNow = { ...windowNowDefaults(window) };

  const filter = () =>
    catalog.filter(
      (p) =>
        withinWindow(p.priceUSD, windowNow) &&
        osPass(p, req) &&
        activeChecks.every((c) => c.pass(p, req)),
    );

  let candidates = filter();

  // Stage 1 — drop spec constraints one by one (weakest-want first) until 3+.
  while (candidates.length < RESULTS_MIN && activeChecks.length > 0) {
    const dropped = activeChecks.shift();
    relaxations.push({
      constraint: dropped.key,
      note: `Fewer than ${RESULTS_MIN} phones matched “${dropped.label(req)}” — the filter was widened.`,
    });
    candidates = filter();
  }

  // Stage 2 — widen the price window stepwise; recorded once, when done.
  let budgetWidened = false;
  while (candidates.length < RESULTS_MIN) {
    const moved = widenWindowOnce(windowNow, window.mode === 'exact');
    if (!moved) break;
    budgetWidened = true;
    candidates = filter();
  }
  if (budgetWidened) {
    relaxations.push({
      constraint: 'budget',
      note: `Not enough phones in the selected price range — results were drawn from ${describeWindow(windowNow)} instead.`,
    });
  }

  // Stage 3 — absolute last resort: relax the OS preference (only if empty).
  if (candidates.length === 0 && req.os !== 'any') {
    relaxations.push({
      constraint: 'os',
      note: `No ${osLabel(req.os)} phone fits at all — showing other platforms instead.`,
    });
    candidates = catalog.filter((p) => withinWindow(p.priceUSD, windowNow));
  }

  // Phones that still satisfy a *relaxed* constraint rank first among the
  // alternates — a dropped must-have is demoted, never forgotten. Phones
  // pushed over the original price ceiling are penalised by overspend ratio.
  const relaxedChecks = CONSTRAINT_CHECKS.filter((c) => c.isActive(req) && !activeChecks.includes(c));
  const adjust = (p) => {
    let adj = relaxedChecks.filter((c) => c.pass(p, req)).length * RELAXED_COMPLIANCE_BONUS;
    if (window.max !== null && p.priceUSD > window.max) {
      adj -= Math.round((p.priceUSD / window.max - 1) * OVERSPEND_PENALTY_SLOPE);
    }
    return adj;
  };

  const ranked = rankCandidates(candidates, need, req, adjust);
  const picked = ranked.slice(0, RESULTS_MAX);
  const osNote = osLabel(req.os);

  return {
    generatedFor: {
      need,
      needLabel: needLabel(need),
      budget: { ...req.budget, windowLabel: window.label },
      prioritySpecs: req.prioritySpecs,
      os: req.os,
      osLabel: osNote,
    },
    market: { ...catalogMeta },
    relaxations,
    count: picked.length,
    recommendations: picked.map(({ phone, matchScore }, i) => ({
      rank: i + 1,
      id: phone.id,
      brand: phone.brand,
      model: phone.model,
      os: phone.os === 'ios' ? 'iOS' : 'Android',
      estimatedPrice: {
        amountUSD: phone.priceUSD,
        label: `≈ ${fmtPrice(phone.priceUSD)}`,
        note: phone.priceNote || null,
        withinSelectedBudget: withinWindow(phone.priceUSD, window),
      },
      matchScore,
      primaryFitReason: buildFitReason(phone, need, req),
      keySpecs: keySpecsOf(phone),
      pros: phone.pros.slice(0, 3),
      cons: phone.cons.slice(0, 3),
    })),
  };
}

const windowNowDefaults = (w) => ({ min: w.min, max: w.max });

const describeWindow = (w) =>
  w.max !== null
    ? `${fmtPrice(w.min)} – ${fmtPrice(w.max)}`
    : w.min > 0
      ? `${fmtPrice(w.min)} and up`
      : 'any price';

/**
 * Nudge a price window outward; returns false once nothing can move.
 * Tier mode steps through neighbouring BUDGET_TIERS (up first, then down);
 * exact mode climbs in $250 increments to $1,750 before opening fully.
 */
function widenWindowOnce(windowNow, isExact = false) {
  const tiers = BUDGET_TIERS;
  if (windowNow.max !== null) {
    if (isExact) {
      const next = windowNow.max + 250;
      windowNow.max = next > 1750 ? null : next;
      return true;
    }
    const idx = tiers.findIndex((t) => t.max === windowNow.max);
    windowNow.max = idx >= 0 && idx < tiers.length - 1 ? tiers[idx + 1].max : null;
    return true;
  }
  if (windowNow.min > 0) {
    const prev = [...tiers].reverse().find((t) => t.max !== null && t.max < windowNow.min);
    windowNow.min = prev ? prev.min : 0;
    return true;
  }
  return false; // window already spans 0 → ∞, nothing left to widen
}

const needLabel = (need) =>
  ({
    camera: 'Camera / Mobile Photography',
    gaming: 'Heavy Gaming & Performance',
    battery: 'All-Day Battery & Charging',
    display: 'Display Quality / Media',
    everyday: 'General Everyday Use',
  })[need];

const osLabel = (key) => OS_OPTIONS.find((o) => o.key === key)?.label || 'No preference';
