// =============================================================================
//  src/data/mockDatabase.js
//  Centralized phone dataset — 8 devices across 5 brands, 2 generations each.
//
//  Spec fields used by the Recommendation Engine scoring algorithm:
//   · processorScore  (1–100)  → used for "Gaming & Performance" weighting
//   · cameraRating    (1–100)  → used for "Photography" weighting
//   · batteryPower    (mAh)    → used for "Long Battery Life" weighting
//   · priceINR        (₹)     → used for "Budget Friendly" sorting + slider filter
//   · ramGB, storageGB         → secondary display & minor weight factors
// =============================================================================

export const phones = [
  // ── Apple ─────────────────────────────────────────────────────────────────
  {
    id: 'iphone-xs',
    name: 'iPhone XS',
    brand: 'Apple',
    priceINR: 59999,
    specs: {
      processorScore: 78,   // A12 Bionic — excellent single-core, dated by 2023 standards
      ramGB: 4,
      batteryPower: 2658,   // mAh — Apple's historically conservative capacity
      cameraRating: 82,     // dual 12MP, Smart HDR, portrait lighting
      storageGB: 64,
      displayType: 'OLED',
    },
    highlights: ['Face ID', 'IP68', 'Dolby Atmos', 'Qi Wireless'],
    year: 2018,
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    brand: 'Apple',
    priceINR: 79900,
    specs: {
      processorScore: 88,   // A15 Bionic (same chip as 13 Pro) — top-tier IPC
      ramGB: 6,
      batteryPower: 3279,
      cameraRating: 91,     // Photonic Engine, Action Mode video, 12MP f/1.5
      storageGB: 128,
      displayType: 'OLED',
    },
    highlights: ['Crash Detection', 'Emergency SOS Satellite', 'Cinematic Mode', 'ProRes'],
    year: 2022,
  },

  // ── Samsung ───────────────────────────────────────────────────────────────
  {
    id: 'galaxy-s9',
    name: 'Samsung Galaxy S9',
    brand: 'Samsung',
    priceINR: 34999,
    specs: {
      processorScore: 70,   // Exynos 9810 / SD845 — strong at launch, slower now
      ramGB: 6,
      batteryPower: 3000,
      cameraRating: 74,     // Variable aperture f/1.5–2.4 innovation, single lens
      storageGB: 64,
      displayType: 'Super AMOLED',
    },
    highlights: ['Variable Aperture', 'Super Slow-Mo 960fps', 'Bixby', 'IP68'],
    year: 2018,
  },
  {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23',
    brand: 'Samsung',
    priceINR: 74999,
    specs: {
      processorScore: 94,   // Snapdragon 8 Gen 2 for Galaxy — class-leading Android
      ramGB: 8,
      batteryPower: 3900,
      cameraRating: 90,     // 50MP triple camera, Expert RAW, Nightography
      storageGB: 128,
      displayType: 'Dynamic AMOLED 2X',
    },
    highlights: ['SD 8 Gen 2 for Galaxy', '200MP camera option', 'Wi-Fi 6E', 'Gorilla Glass Victus 2'],
    year: 2023,
  },

  // ── OnePlus ───────────────────────────────────────────────────────────────
  {
    id: 'oneplus-11',
    name: 'OnePlus 11',
    brand: 'OnePlus',
    priceINR: 61999,
    specs: {
      processorScore: 93,   // Snapdragon 8 Gen 2 — flagship-tier
      ramGB: 16,            // Top model — best RAM in segment
      batteryPower: 5000,
      cameraRating: 85,     // Hasselblad Natural Colour Calibration, 50MP triple
      storageGB: 256,
      displayType: 'LTPO3 AMOLED',
    },
    highlights: ['100W SUPERVOOC', 'Hasselblad Cameras', 'Alert Slider', 'OxygenOS 13'],
    year: 2023,
  },
  {
    id: 'oneplus-9',
    name: 'OnePlus 9',
    brand: 'OnePlus',
    priceINR: 44999,
    specs: {
      processorScore: 85,   // Snapdragon 888 — still fast
      ramGB: 8,
      batteryPower: 4500,
      cameraRating: 80,     // Hasselblad-tuned 48MP system
      storageGB: 128,
      displayType: 'Fluid AMOLED',
    },
    highlights: ['65W Warp Charge', 'Hasselblad Optics', '120Hz Display', 'Wi-Fi 6'],
    year: 2021,
  },

  // ── Google ────────────────────────────────────────────────────────────────
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    brand: 'Google',
    priceINR: 59999,
    specs: {
      processorScore: 86,   // Google Tensor G2 — AI-superior, slightly behind SD 8 Gen 2 raw
      ramGB: 8,
      batteryPower: 4355,
      cameraRating: 95,     // Best-in-class computational photography, Night Sight, Magic Eraser
      storageGB: 128,
      displayType: 'OLED',
    },
    highlights: ['Tensor G2 AI Chip', 'Magic Eraser', 'Night Sight', '5 yrs Security Updates'],
    year: 2022,
  },

  // ── Huawei ────────────────────────────────────────────────────────────────
  {
    id: 'huawei-mate-20-pro',
    name: 'Huawei Mate 20 Pro',
    brand: 'Huawei',
    priceINR: 69999,
    specs: {
      processorScore: 76,   // Kirin 980 — strong at launch, no Google services
      ramGB: 6,
      batteryPower: 4200,
      cameraRating: 88,     // Leica Triple-cam (40MP+20MP+8MP), best-in-class at launch
      storageGB: 128,
      displayType: 'OLED',
    },
    highlights: ['Leica Triple Camera', '40W SuperCharge', 'Reverse Wireless Charging', 'IP68'],
    year: 2018,
  },
];

// ── Brand metadata for filter chips ──────────────────────────────────────────
export const brandMeta = {
  Apple:   { color: '#a78bfa', icon: 'fa-brands fa-apple' },
  Samsung: { color: '#38bdf8', icon: 'fa-solid fa-mobile-screen-button' },
  OnePlus: { color: '#fb7185', icon: 'fa-solid fa-bolt' },
  Google:  { color: '#34d399', icon: 'fa-brands fa-google' },
  Huawei:  { color: '#fbbf24', icon: 'fa-solid fa-signal' },
};

// ── Priority scoring rules (pure functions) ───────────────────────────────────
//  Each function takes a phone object and returns a numeric composite score (0–100).
//  These rules are consumed by the useMemo recommendation engine in App.js.
export const scoringRules = {
  /**
   * Gaming & Performance
   *  · processorScore carries 60% of total weight (raw CPU/GPU throughput)
   *  · ramGB normalised to /16 carries 40% (multitasking head-room)
   *  Formula: processorScore*0.6 + (ramGB/16*100)*0.4
   */
  gaming: (phone) =>
    phone.specs.processorScore * 0.6 + (phone.specs.ramGB / 16) * 100 * 0.4,

  /**
   * Photography
   *  · cameraRating is the composite photography benchmark (carries 80%)
   *  · processorScore carries 20% (ISP quality correlates with chip score)
   *  Formula: cameraRating*0.8 + processorScore*0.2
   */
  photography: (phone) =>
    phone.specs.cameraRating * 0.8 + phone.specs.processorScore * 0.2,

  /**
   * Long Battery Life
   *  · batteryPower normalised to /5000 mAh baseline carries 70%
   *  · processorScore carries 30% (efficient chips extend real-world battery life)
   *  Formula: (batteryPower/5000*100)*0.7 + processorScore*0.3
   */
  battery: (phone) =>
    (phone.specs.batteryPower / 5000) * 100 * 0.7 + phone.specs.processorScore * 0.3,

  /**
   * Budget Friendly
   *  · Purely inverted price ratio: cheapest phone gets score 100
   *  · Baseline: ₹150,000 (slider max). Score = (1 - price/150000) * 100
   *  · No other spec weighting — pure value-for-money signal
   */
  budget: (phone) =>
    (1 - phone.priceINR / 150000) * 100,
};

export const PRIORITIES = [
  { key: 'gaming',      label: 'Gaming & Performance', icon: 'fa-solid fa-gamepad',     color: '#a78bfa' },
  { key: 'photography', label: 'Photography',           icon: 'fa-solid fa-camera',      color: '#f472b6' },
  { key: 'battery',     label: 'Long Battery Life',     icon: 'fa-solid fa-battery-full', color: '#34d399' },
  { key: 'budget',      label: 'Budget Friendly',       icon: 'fa-solid fa-tag',          color: '#fbbf24' },
];

// All unique brand names derived from the phones array
export const allBrands = [...new Set(phones.map((p) => p.brand))];
