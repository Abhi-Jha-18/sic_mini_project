// PhoneFit's live catalog is generated from the client-provided CSV.
// Keep the original spreadsheet in data/ and rebuild the normalized JSON with:
//   npm run data:prepare
import clientPhoneRows from './clientPhones.json' with { type: 'json' };
import { USD_TO_INR_RATE, USD_TO_INR_RATE_DATE } from './currency.js';

// Budget band boundaries in INR (single source of truth for tiers and tierOf).
const ENTRY_MAX_INR = 20000;
const MID_MAX_INR = 50000;

export const DATASET_META = {
  source: 'data/sic_mobile_spec_PJ1 - Sheet1.csv',
  sourceCurrency: 'USD',
  currency: 'INR',
  usdToInrRate: USD_TO_INR_RATE,
  conversionDate: USD_TO_INR_RATE_DATE,
  recordCount: clientPhoneRows.length,
};

export const PURPOSES = [
  {
    key: 'gaming',
    label: 'Gaming',
    description: 'Prioritize memory, battery capacity, and customer ratings',
    icon: 'fa-solid fa-gamepad',
    tint: '#9C8BD8',
  },
  {
    key: 'camera',
    label: 'Photography/Videography',
    description: 'Prioritize the listed camera resolution and customer ratings',
    icon: 'fa-solid fa-camera-retro',
    tint: '#D0967B',
  },
  {
    key: 'battery',
    label: 'Daily Work & Battery Life',
    description: 'Prioritize battery capacity, memory, and customer ratings',
    icon: 'fa-solid fa-battery-three-quarters',
    tint: '#8FC1A4',
  },
  {
    key: 'media',
    label: 'Media Consumption/Display',
    description: 'Prioritize display type, screen size, and storage',
    icon: 'fa-solid fa-film',
    tint: '#7FA8D9',
  },
  {
    key: 'everyday',
    label: 'General Everyday Use',
    description: 'Balance customer rating and the listed hardware specs',
    icon: 'fa-solid fa-wand-magic-sparkles',
    tint: '#C9B98F',
  },
];

export const purposeMeta = (key) => PURPOSES.find((purpose) => purpose.key === key) || PURPOSES[4];

// Prices are shown in INR after a fixed conversion from the USD source values.
// Standard Indian budget bands keep the interface familiar and useful.
export const BUDGET_TIERS = [
  {
    key: 'entry',
    label: 'Entry-level',
    range: 'Under ₹20,000',
    description: 'Lower-priced devices in the client catalog',
    matches: (phone) => phone.priceINR < ENTRY_MAX_INR,
  },
  {
    key: 'mid',
    label: 'Mid-range',
    range: '₹20,000 – ₹50,000',
    description: 'Mid-priced devices in the client catalog',
    matches: (phone) => phone.priceINR >= ENTRY_MAX_INR && phone.priceINR <= MID_MAX_INR,
  },
  {
    key: 'flagship',
    label: 'Premium',
    range: 'Above ₹50,000',
    description: 'Higher-priced devices in the client catalog',
    matches: (phone) => phone.priceINR > MID_MAX_INR,
  },
];

export const budgetMeta = (key) => BUDGET_TIERS.find((tier) => tier.key === key) || BUDGET_TIERS[1];

export const SIZE_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: 'compact', label: 'Compact · ≤ 6.3"' },
  { key: 'standard', label: 'Standard · 6.4" – 6.5"' },
  { key: 'large', label: 'Large · 6.6" +' },
];

// Preserve every client row. Missing OS, refresh-rate, chipset benchmarks,
// camera sensor details, and charging specifications are intentionally not
// invented; the `processor` field is only what the source CSV lists.
export const phones = clientPhoneRows;

// Missing or non-numeric values score 0 instead of producing NaN.
const clampScore = (value, max) => {
  const ratio = (Number(value) / max) * 100;
  return Number.isFinite(ratio) ? Math.max(0, Math.min(ratio, 100)) : 0;
};
const ratingScore = (phone) => clampScore(phone.rating, 5);
const ramScore = (phone) => clampScore(phone.ramGB, 12);
const batteryScore = (phone) => clampScore(phone.batteryMah, 6000);
const cameraScore = (phone) => clampScore(phone.cameraMP, 200);
const storageScore = (phone) => clampScore(phone.storageGB, 512);
const screenSizeScore = (phone) => clampScore(phone.screenInches, 7.6);

const displayTypeScore = (phone) => {
  const type = phone.displayType.toLowerCase();
  if (type.includes('oled')) return 100; // also matches AMOLED / P-OLED
  if (type.includes('lcd')) return 60;
  if (type.includes('tft')) return 40;
  return 50;
};

// These are transparent rule-based ranking heuristics using only fields in the
// supplied data (customer rating and listed hardware capacity/type), not claimed
// benchmark measurements or AI-generated product assessments.
export const scoringRules = {
  gaming: (phone) => ramScore(phone) * 0.42 + ratingScore(phone) * 0.35 + batteryScore(phone) * 0.23,
  camera: (phone) => cameraScore(phone) * 0.75 + ratingScore(phone) * 0.25,
  battery: (phone) => batteryScore(phone) * 0.65 + ratingScore(phone) * 0.2 + ramScore(phone) * 0.15,
  media: (phone) =>
    displayTypeScore(phone) * 0.35 + screenSizeScore(phone) * 0.2 + storageScore(phone) * 0.2 + ratingScore(phone) * 0.25,
  everyday: (phone) =>
    ratingScore(phone) * 0.4 + ramScore(phone) * 0.15 + batteryScore(phone) * 0.15 + cameraScore(phone) * 0.15 + displayTypeScore(phone) * 0.15,
};

export const scorePhone = (phone, purposeKey) =>
  Math.round((scoringRules[purposeKey] || scoringRules.everyday)(phone));

export const tierOf = (phone) => {
  if (phone.priceINR < ENTRY_MAX_INR) return 'entry';
  if (phone.priceINR <= MID_MAX_INR) return 'mid';
  return 'flagship';
};

export const sizeOf = (phone) =>
  phone.screenInches <= 6.3 ? 'compact' : phone.screenInches >= 6.6 ? 'large' : 'standard';

const displayName = (phone) => `${phone.screenInches}" ${phone.displayType}`;
const cameraName = (phone) => phone.cameraMP > 0 ? `${phone.cameraMP} MP camera listing` : 'Camera resolution not listed';

export const purposeNotesFor = (phone) => ({
  gaming: [`${phone.ramGB} GB RAM listed`, `${phone.batteryMah.toLocaleString()} mAh battery listed`],
  camera: [cameraName(phone), `Customer rating: ${phone.rating}/5`],
  battery: [`${phone.batteryMah.toLocaleString()} mAh battery listed`, `Weight: ${phone.weightGrams} g`],
  media: [displayName(phone), `${phone.storageGB >= 1024 ? `${phone.storageGB / 1024} TB` : `${phone.storageGB} GB`} storage listed`],
  everyday: [`Customer rating: ${phone.rating}/5`, `${phone.ramGB} GB RAM · ${phone.storageGB} GB storage`],
});

export function getRecommendations({ purpose, budget, size = 'any', limit = 4 }) {
  const tier = budgetMeta(budget);
  const relaxed = [];
  const scoreList = (filter) => phones
    .filter(filter)
    .map((phone) => ({ phone, match: scorePhone(phone, purpose) }))
    .sort((a, b) => b.match - a.match || a.phone.priceINR - b.phone.priceINR);

  const inTier = (phone) => tier.matches(phone);
  const sizeMatches = (phone) => {
    if (size === 'any') return true;
    const phoneSize = sizeOf(phone);
    return phoneSize === size;
  };

  let list = scoreList((phone) => inTier(phone) && sizeMatches(phone));
  if (list.length < 3 && size !== 'any') {
    const widened = scoreList(inTier);
    if (widened.length > list.length) {
      list = widened;
      relaxed.push('screen size');
    }
  }
  const boundedLimit = Number.isFinite(limit) ? Math.max(0, limit) : list.length;
  return { list: list.slice(0, boundedLimit), relaxed };
}

// Neutral fallback tone works for every client-supplied brand.
export const brandTones = {};