// =============================================================================
//  src/wizard/config.js — PhoneFit wizard · declarative configuration
//
//  This module is the *single source of truth* for everything the 3-step
//  wizard can ask. It is pure data + tiny pure helpers — no UI, no state.
//
//    STEP 1 → NEEDS              (primary need selection)
//    STEP 2 → BUDGET_TIERS / PRIORITY_SPEC_OPTIONS / OS_OPTIONS
//    STEP 3 → NEED_WEIGHTS       (how the engine weighs specs per need)
//
//  Prices in the catalog are USD (global/US market, verified October 2026).
//  To serve another market, swap BUDGET_TIERS and the catalog price field —
//  the engine only ever reads `budget.min` / `budget.max` / `phone.priceUSD`.
// =============================================================================

// ── Flow descriptor ────────────────────────────────────────────────────────
// A machine-readable description of the whole wizard, so any UI (or tests)
// can render/drive it without hard-coding step structure.
export const WIZARD_FLOW = [
  {
    step: 1,
    id: 'primary-need',
    title: 'What do you need your phone to be great at?',
    input: 'need', // single-select, one of NEEDS[].key
    required: true,
  },
  {
    step: 2,
    id: 'specs-and-price',
    title: 'Set your budget and must-have specs',
    input: 'requirements', // { budget, prioritySpecs, os }
    required: true,
  },
  {
    step: 3,
    id: 'recommendations',
    title: 'Your tailored picks',
    input: null, // output-only step: RecommendationSet (see schemas.js)
    required: false,
  },
];

// ── Step 1 · Primary needs ─────────────────────────────────────────────────
export const NEEDS = [
  {
    key: 'camera',
    label: 'Camera / Mobile Photography',
    description: 'Sensor quality, zoom range, low-light and video stabilisation',
  },
  {
    key: 'gaming',
    label: 'Heavy Gaming & Performance',
    description: 'Top-tier chipset, thermal headroom, high refresh rate, big RAM',
  },
  {
    key: 'battery',
    label: 'All-Day Battery & Charging',
    description: 'Huge cells, efficient silicon and genuinely fast charging',
  },
  {
    key: 'display',
    label: 'Display Quality / Media Consumption',
    description: 'Brightness, colour accuracy, resolution and smooth motion',
  },
  {
    key: 'everyday',
    label: 'General Everyday Use',
    description: 'Balanced all-rounders with nothing important missing',
  },
];

export const isValidNeed = (key) => NEEDS.some((n) => n.key === key);

// ── Step 2 · Budget tiers (USD) ────────────────────────────────────────────
// `max: null` means unbounded above. The engine compares against priceUSD.
export const BUDGET_TIERS = [
  { key: 'under-300',  label: 'Under $300',    min: 0,    max: 299 },
  { key: '300-600',    label: '$300 – $600',   min: 300,  max: 600 },
  { key: '600-1000',   label: '$600 – $1,000', min: 601,  max: 1000 },
  { key: '1000-plus',  label: '$1,000+',       min: 1001, max: null },
];

export const isValidTier = (key) => BUDGET_TIERS.some((t) => t.key === key);

// Exact-budget mode bounds (guards against nonsense input like $5 or $99,999).
export const EXACT_BUDGET_LIMITS = { min: 50, max: 3000 };

// In exact-budget mode the engine gives a small purchase-price grace band
// (street prices fluctuate) and rewards phones that use the budget well.
export const EXACT_BUDGET_GRACE = 0.05; // a phone ≤ 105 % of budget still fits

// ── Step 2 · Priority spec options ─────────────────────────────────────────
// All optional; anything the user sets becomes a *hard* constraint first and
// is relaxed in RELAXATION_ORDER (engine.js) only when results run dry.
export const RAM_OPTIONS_GB = [4, 6, 8, 12, 16];
export const STORAGE_OPTIONS_GB = [64, 128, 256, 512];
export const BATTERY_OPTIONS_MAH = [4000, 5000, 6000, 7000];
export const REFRESH_OPTIONS_HZ = [60, 90, 120, 144];

export const CHIPSET_OPTIONS = [
  { key: 'any',        label: 'No preference' },
  { key: 'snapdragon', label: 'Qualcomm Snapdragon' },
  { key: 'apple',      label: 'Apple silicon' },
  { key: 'tensor',     label: 'Google Tensor' },
  { key: 'dimensity',  label: 'MediaTek Dimensity' },
  { key: 'exynos',     label: 'Samsung Exynos' },
];

// "Camera setup" = a concrete hardware requirement, not a vague wish.
export const CAMERA_SETUP_OPTIONS = [
  { key: 'any',       label: 'Any camera setup' },
  { key: 'telephoto', label: 'Must have a telephoto / zoom lens' },
  { key: 'ois',       label: 'Must have optical stabilisation (OIS)' },
];

// ── Step 2 · OS preference ─────────────────────────────────────────────────
export const OS_OPTIONS = [
  { key: 'any',     label: 'No preference' },
  { key: 'android', label: 'Android' },
  { key: 'ios',     label: 'iOS' },
];

export const isValidOS = (key) => OS_OPTIONS.some((o) => o.key === key);

// ── Step 3 · Scoring weights per need ──────────────────────────────────────
// Each catalog phone carries attribute scores (0–100) for these five
// attributes; the engine forms a need-specific weighted composite.
// Rows sum to 1.00. `value` always keeps a voice so absurdly priced kills get
// rejected even when the budget allows them.
export const NEED_WEIGHTS = {
  camera:   { camera: 0.45, performance: 0.15, display: 0.15, battery: 0.10, value: 0.15 },
  gaming:   { performance: 0.45, battery: 0.20, display: 0.15, value: 0.15, camera: 0.05 },
  battery:  { battery: 0.45, value: 0.20, performance: 0.15, camera: 0.10, display: 0.10 },
  display:  { display: 0.45, battery: 0.15, performance: 0.15, value: 0.15, camera: 0.10 },
  everyday: { value: 0.30, battery: 0.20, camera: 0.20, performance: 0.15, display: 0.15 },
};

export const RESULTS_MIN = 3;
export const RESULTS_MAX = 4;
