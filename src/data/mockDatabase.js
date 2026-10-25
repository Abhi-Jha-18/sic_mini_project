// =============================================================================
//  src/data/mockDatabase.js — PhoneFit recommendation dataset
//
//  Powers the 3-stage flow:
//    1. PURPOSES       → the landing-page prompt ("What is the primary purpose
//                         or main feature you need in your mobile phone?")
//    2. BUDGET_TIERS   → the step-2 modal (price range + optional filters)
//    3. getRecommendations() → top 3–4 tailored matches for step 3 cards
//
//  Each phone carries handwritten `purposeNotes` so the Key Highlights shown on
//  a result card are tailored to the user's selected purpose, plus concise
//  `pros` / `cons` bullets. Scores are 0–100 composites — higher is better.
// =============================================================================

// ── Step 1 · Primary purposes ───────────────────────────────────────────────
export const PURPOSES = [
  {
    key: 'gaming',
    label: 'Gaming',
    description: 'High FPS, sustained performance and big batteries',
    icon: 'fa-solid fa-gamepad',
    tint: '#9C8BD8',
  },
  {
    key: 'camera',
    label: 'Photography/Videography',
    description: 'Great cameras, low light and stable video',
    icon: 'fa-solid fa-camera-retro',
    tint: '#D0967B',
  },
  {
    key: 'battery',
    label: 'Daily Work & Battery Life',
    description: 'All-day battery, calls and productivity',
    icon: 'fa-solid fa-battery-three-quarters',
    tint: '#8FC1A4',
  },
  {
    key: 'media',
    label: 'Media Consumption/Display',
    description: 'Binge-worthy screens, speakers and storage',
    icon: 'fa-solid fa-film',
    tint: '#7FA8D9',
  },
  {
    key: 'everyday',
    label: 'General Everyday Use',
    description: 'Balanced all-rounders that do everything well',
    icon: 'fa-solid fa-wand-magic-sparkles',
    tint: '#C9B98F',
  },
];

export const purposeMeta = (key) => PURPOSES.find((p) => p.key === key) || PURPOSES[4];

// ── Step 2 · Budget tiers (Indian pricing) ─────────────────────────────────
export const BUDGET_TIERS = [
  {
    key: 'entry',
    label: 'Entry-level',
    range: 'Under ₹20,000',
    description: 'Smart value — the essentials done right',
    matches: (p) => p.priceINR < 20000,
  },
  {
    key: 'mid',
    label: 'Mid-range',
    range: '₹20,000 – ₹50,000',
    description: 'The sweet spot of price and performance',
    matches: (p) => p.priceINR >= 20000 && p.priceINR <= 50000,
  },
  {
    key: 'flagship',
    label: 'Flagship',
    range: 'Above ₹50,000',
    description: 'No compromises — the very best',
    matches: (p) => p.priceINR > 50000,
  },
];

export const budgetMeta = (key) => BUDGET_TIERS.find((t) => t.key === key) || BUDGET_TIERS[1];

// ── Step 2 · Optional preference filters ───────────────────────────────────
export const OS_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: 'iOS', label: 'iOS' },
  { key: 'Android', label: 'Android' },
];

export const SIZE_OPTIONS = [
  { key: 'any', label: 'Any' },
  { key: 'compact', label: 'Compact · ≤ 6.3"' },
  { key: 'large', label: 'Large · 6.6" +' },
];

// ── Phone catalog ──────────────────────────────────────────────────────────
//  fields:
//    chipset, screenInches, displayType, refreshHz  → context + auto spec line
//    specs.processorScore / cameraRating / displayScore (0–100)
//    specs.ramGB / batteryPower(mAh) / storageGB
//    purposeNotes[purposeKey] → 2 tailored highlight chips (step-3 cards)
//    pros[3] / cons[2]        → concise bullets (step-3 cards)
export const phones = [
  // ═══════════════ Entry-level (under ₹20,000) ═══════════════════════════
  {
    id: 'nothing-2a',
    name: 'Nothing Phone (2a)',
    brand: 'Nothing',
    os: 'Android',
    priceINR: 18999,
    year: 2024,
    chipset: 'Dimensity 7200 Pro',
    screenInches: 6.7,
    displayType: 'AMOLED',
    refreshHz: 120,
    specs: { processorScore: 58, ramGB: 8, batteryPower: 5000, cameraRating: 68, storageGB: 128, displayScore: 82 },
    purposeNotes: {
      gaming: ['Smooth 120 Hz panel', 'Fine for casual titles'],
      camera: ['50 MP main with OIS', 'True-to-life colours'],
      battery: ['5000 mAh all-day cell', '33 W fast charging'],
      media: ['Vivid 6.7" AMOLED', 'Stereo dual speakers'],
      everyday: ['Bloat-free near-stock Android', 'Distinct Glyph design'],
    },
    pros: ['Clean, near-stock Android', 'Unique Glyph interface', 'Excellent AMOLED for the price'],
    cons: ['Average low-light camera', 'Just 33 W charging'],
  },
  {
    id: 'poco-x6-pro',
    name: 'Poco X6 Pro',
    brand: 'Poco',
    os: 'Android',
    priceINR: 19999,
    year: 2024,
    chipset: 'Dimensity 8300-Ultra',
    screenInches: 6.67,
    displayType: '1.5K AMOLED',
    refreshHz: 120,
    specs: { processorScore: 80, ramGB: 8, batteryPower: 5000, cameraRating: 66, storageGB: 256, displayScore: 84 },
    purposeNotes: {
      gaming: ['Near-flagship frame rates', 'Vapour chamber cooling'],
      camera: ['64 MP OIS main', 'Good daylight detail'],
      battery: ['5000 mAh with 67 W charge', 'Efficient 4 nm chip'],
      media: ['Crisp 1.5K AMOLED', '256 GB base storage'],
      everyday: ['Flagship speed on a budget', '256 GB base storage'],
    },
    pros: ['Flagship-grade performance', 'Sharp 1.5K display', '67 W fast charging'],
    cons: ['Cameras are merely average', 'MIUI ads and bloatware'],
  },
  {
    id: 'galaxy-a35',
    name: 'Samsung Galaxy A35 5G',
    brand: 'Samsung',
    os: 'Android',
    priceINR: 19499,
    year: 2024,
    chipset: 'Exynos 1380',
    screenInches: 6.6,
    displayType: 'Super AMOLED',
    refreshHz: 120,
    specs: { processorScore: 58, ramGB: 8, batteryPower: 5000, cameraRating: 72, storageGB: 128, displayScore: 85 },
    purposeNotes: {
      gaming: ['Stable 120 Hz gaming', 'Handles medium settings'],
      camera: ['50 MP OIS main camera', '4 years of OS updates'],
      battery: ['5000 mAh two-day light use', 'IP67 water resistance'],
      media: ['Bright Super AMOLED', 'IP67 for poolside streaming'],
      everyday: ['4 Android OS updates promised', 'IP67 + Gorilla Glass Victus'],
    },
    pros: ['Long software support', 'IP67 water resistance', 'Reliable OIS camera'],
    cons: ['Slower 25 W charging', 'Not for heavy gaming'],
  },
  {
    id: 'redmi-note-13-pro',
    name: 'Redmi Note 13 Pro',
    brand: 'Redmi',
    os: 'Android',
    priceINR: 18499,
    year: 2024,
    chipset: 'Snapdragon 7s Gen 2',
    screenInches: 6.67,
    displayType: '1.5K AMOLED',
    refreshHz: 120,
    specs: { processorScore: 62, ramGB: 8, batteryPower: 5100, cameraRating: 75, storageGB: 256, displayScore: 83 },
    purposeNotes: {
      gaming: ['120 Hz smooth scrolling', 'Casual-gaming ready'],
      camera: ['200 MP detail-rich main', 'OIS for steady shots'],
      battery: ['5100 mAh big battery', '67 W turbo charging'],
      media: ['Sharp 1.5K AMOLED panel', '256 GB for offline media'],
      everyday: ['200 MP camera on a budget', 'Big 5100 mAh battery'],
    },
    pros: ['200 MP camera with OIS', 'Sharp 1.5K AMOLED', '67 W charging'],
    cons: ['Heavy MIUI software skin', 'Ultra-wide camera is weak'],
  },
  {
    id: 'galaxy-m35',
    name: 'Samsung Galaxy M35 5G',
    brand: 'Samsung',
    os: 'Android',
    priceINR: 15999,
    year: 2024,
    chipset: 'Exynos 1380',
    screenInches: 6.6,
    displayType: 'Super AMOLED',
    refreshHz: 120,
    specs: { processorScore: 57, ramGB: 6, batteryPower: 6000, cameraRating: 64, storageGB: 128, displayScore: 80 },
    purposeNotes: {
      gaming: ['6000 mAh marathon sessions', '120 Hz smooth panel'],
      camera: ['50 MP main with OIS', 'Reliable daylight photos'],
      battery: ['6000 mAh class-leading battery', 'Two days of light use'],
      media: ['Big 6.6" Super AMOLED', '6000 mAh binge sessions'],
      everyday: ['Battery that never quits', 'Samsung update promise'],
    },
    pros: ['Massive 6000 mAh battery', 'Bright Super AMOLED', 'Affordable entry price'],
    cons: ['Thick and heavy build', 'Average cameras'],
  },
  {
    id: 'moto-g85',
    name: 'Motorola Moto G85 5G',
    brand: 'Motorola',
    os: 'Android',
    priceINR: 17999,
    year: 2024,
    chipset: 'Snapdragon 6s Gen 3',
    screenInches: 6.67,
    displayType: 'pOLED',
    refreshHz: 120,
    specs: { processorScore: 52, ramGB: 8, batteryPower: 5000, cameraRating: 66, storageGB: 128, displayScore: 81 },
    purposeNotes: {
      gaming: ['120 Hz for casual games', 'Cool and quiet in hand'],
      camera: ['50 MP OIS main camera', 'Clean Motorola processing'],
      battery: ['5000 mAh + 33 W charging', 'Sips power on standby'],
      media: ['Curved pOLED display', 'Stereo speakers with Dolby'],
      everyday: ['Stock Android, zero bloat', 'Slim, curved design'],
    },
    pros: ['Clean stock Android', 'Curved pOLED design', 'Light, comfortable build'],
    cons: ['Entry-level performance', 'Only 33 W charging'],
  },

  // ═══════════════ Mid-range (₹20,000 – ₹50,000) ═════════════════════════
  {
    id: 'oneplus-12r',
    name: 'OnePlus 12R',
    brand: 'OnePlus',
    os: 'Android',
    priceINR: 39999,
    year: 2024,
    chipset: 'Snapdragon 8 Gen 2',
    screenInches: 6.78,
    displayType: 'LTPO AMOLED',
    refreshHz: 120,
    specs: { processorScore: 92, ramGB: 8, batteryPower: 5500, cameraRating: 80, storageGB: 128, displayScore: 92 },
    purposeNotes: {
      gaming: ['Console-grade GPU headroom', 'Aerospace vapour cooling'],
      camera: ['50 MP Sony OIS main', 'Solid night mode'],
      battery: ['5500 mAh + 100 W charge', 'Full day of heavy use'],
      media: ['1.5K LTPO 120 Hz display', 'Dolby Vision + stereo sound'],
      everyday: ['Flagship chip, mid-range price', '100 W top-ups in 30 min'],
    },
    pros: ['Flagship-class performance', '100 W charging with big battery', 'Excellent 1.5K display'],
    cons: ['No official IP rating', 'No wireless charging'],
  },
  {
    id: 'pixel-8a',
    name: 'Google Pixel 8a',
    brand: 'Google',
    os: 'Android',
    priceINR: 37999,
    year: 2024,
    chipset: 'Tensor G3',
    screenInches: 6.1,
    displayType: 'OLED',
    refreshHz: 120,
    specs: { processorScore: 78, ramGB: 8, batteryPower: 4492, cameraRating: 92, storageGB: 128, displayScore: 88 },
    purposeNotes: {
      gaming: ['Runs popular titles well', '120 Hz Actua display'],
      camera: ['Best-in-class point-and-shoot', 'Magic Eraser & Photo Unblur'],
      battery: ['Adaptive Battery with Tensor G3', '24h+ with mixed use'],
      media: ['Colour-accurate Actua OLED', '7 years of updates'],
      everyday: ['7 years of software updates', 'Compact one-hand size'],
    },
    pros: ['Outstanding camera for the price', 'Compact and pocket-friendly', '7 years of updates'],
    cons: ['Slow 18 W charging', 'Tensor runs warm in games'],
  },
  {
    id: 'galaxy-a55',
    name: 'Samsung Galaxy A55 5G',
    brand: 'Samsung',
    os: 'Android',
    priceINR: 33999,
    year: 2024,
    chipset: 'Exynos 1480',
    screenInches: 6.6,
    displayType: 'Super AMOLED',
    refreshHz: 120,
    specs: { processorScore: 70, ramGB: 8, batteryPower: 5000, cameraRating: 78, storageGB: 128, displayScore: 88 },
    purposeNotes: {
      gaming: ['Stable 120 Hz gaming', 'Metal frame stays cool'],
      camera: ['50 MP OIS + 32 MP selfie', 'Flagship-style image tuning'],
      battery: ['5000 mAh all-day battery', 'IP67 water resistance'],
      media: ['Gorgeous Super AMOLED', 'IP67 + Gorilla Glass Victus'],
      everyday: ['Premium metal frame', '4 OS updates + IP67'],
    },
    pros: ['Premium glass-metal build', 'IP67 and long update promise', 'Reliable OIS cameras'],
    cons: ['25 W charging feels slow', 'Not a gaming specialist'],
  },
  {
    id: 'nothing-2',
    name: 'Nothing Phone (2)',
    brand: 'Nothing',
    os: 'Android',
    priceINR: 29999,
    year: 2023,
    chipset: 'Snapdragon 8+ Gen 1',
    screenInches: 6.7,
    displayType: 'LTPO AMOLED',
    refreshHz: 120,
    specs: { processorScore: 84, ramGB: 8, batteryPower: 4700, cameraRating: 74, storageGB: 128, displayScore: 88 },
    purposeNotes: {
      gaming: ['Pro-grade 8+ Gen 1 chip', 'LTPO 1–120 Hz adaptive'],
      camera: ['50 MP dual OIS cameras', 'Clean, natural processing'],
      battery: ['4700 mAh + 45 W charge', 'Glyph light notifications'],
      media: ['Adaptive LTPO display', 'Immersive stereo mix'],
      everyday: ['Distinctive Glyph interface', 'Smooth Nothing OS'],
    },
    pros: ['Unique Glyph design', 'Smooth near-stock software', 'Capable flagship-grade chip'],
    cons: ['Cameras trail the leaders', 'No charger in the box'],
  },
  {
    id: 'iqoo-neo-9-pro',
    name: 'iQOO Neo 9 Pro',
    brand: 'iQOO',
    os: 'Android',
    priceINR: 31999,
    year: 2024,
    chipset: 'Snapdragon 8 Gen 2',
    screenInches: 6.78,
    displayType: 'AMOLED',
    refreshHz: 144,
    specs: { processorScore: 93, ramGB: 8, batteryPower: 5160, cameraRating: 76, storageGB: 256, displayScore: 90 },
    purposeNotes: {
      gaming: ['144 Hz esports-grade panel', 'Q1 chip for 90 FPS gaming'],
      camera: ['50 MP Sony IMX920 OIS', 'Good motion capture'],
      battery: ['5160 mAh + 120 W charge', 'Marathon gaming sessions'],
      media: ['144 Hz 1.5K AMOLED', '256 GB base storage'],
      everyday: ['Flagship power at ₹32K', '120 W zero-to-full in 25 min'],
    },
    pros: ['Exceptional gaming performance', '120 W ultra-fast charging', 'Bright 144 Hz display'],
    cons: ['Funtouch OS has bloatware', 'Ultrawide camera is average'],
  },
  {
    id: 'edge-50-pro',
    name: 'Motorola Edge 50 Pro',
    brand: 'Motorola',
    os: 'Android',
    priceINR: 29999,
    year: 2024,
    chipset: 'Snapdragon 7 Gen 3',
    screenInches: 6.7,
    displayType: 'pOLED',
    refreshHz: 144,
    specs: { processorScore: 72, ramGB: 8, batteryPower: 4500, cameraRating: 79, storageGB: 256, displayScore: 90 },
    purposeNotes: {
      gaming: ['144 Hz curved pOLED', 'Cool and efficient chip'],
      camera: ['50 MP OIS + 3x telephoto', 'True colour science'],
      battery: ['125 W wired + 50 W wireless', '4500 mAh smart battery'],
      media: ['Pantone-validated 144 Hz panel', '256 GB + Dolby Atmos'],
      everyday: ['125 W + 50 W wireless charging', 'IP68 and vegan leather'],
    },
    pros: ['Fastest charging in class', '125 W + 50 W wireless', 'IP68 with premium finish'],
    cons: ['Battery capacity just average', 'Moto update pace is slow'],
  },
  {
    id: 'iphone-15',
    name: 'Apple iPhone 15',
    brand: 'Apple',
    os: 'iOS',
    priceINR: 64999,
    year: 2023,
    chipset: 'A16 Bionic',
    screenInches: 6.1,
    displayType: 'OLED',
    refreshHz: 60,
    specs: { processorScore: 90, ramGB: 6, batteryPower: 3349, cameraRating: 87, storageGB: 128, displayScore: 90 },
    purposeNotes: {
      gaming: ['A16 handles every title', 'Cool, sustained performance'],
      camera: ['48 MP main with 2x zoom', 'Cinematic Mode 4K video'],
      battery: ['All-day iOS battery life', 'USB-C + MagSafe charging'],
      media: ['Super Retina XDR OLED', 'Dolby Vision HDR playback'],
      everyday: ['Dynamic Island + USB-C', 'Compact 6.1" body'],
    },
    pros: ['48 MP main camera upgrade', 'USB-C at last', 'Smooth iOS with long support'],
    cons: ['60 Hz display only', 'Slow charging speeds'],
  },
  {
    id: 'iphone-13',
    name: 'Apple iPhone 13',
    brand: 'Apple',
    os: 'iOS',
    priceINR: 49999,
    year: 2021,
    chipset: 'A15 Bionic',
    screenInches: 6.1,
    displayType: 'OLED',
    refreshHz: 60,
    specs: { processorScore: 88, ramGB: 4, batteryPower: 3240, cameraRating: 84, storageGB: 128, displayScore: 86 },
    purposeNotes: {
      gaming: ['A15 handles every title', 'Console-grade GPU cores'],
      camera: ['Cinematic Mode video', 'Dual 12 MP with sensor-shift OIS'],
      battery: ['All-day iOS battery life', 'Efficient A15 power draw'],
      media: ['Super Retina XDR OLED', 'Dolby Vision HDR playback'],
      everyday: ['iOS with 5+ years of updates', 'Compact 6.1" body'],
    },
    pros: ['Smooth, secure iOS experience', 'Excellent video recording', 'Compact and light'],
    cons: ['60 Hz screen only', 'Lightning port, slow charging'],
  },

  // ═══════════════ Flagship (above ₹50,000) ═══════════════════════════════
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    brand: 'OnePlus',
    os: 'Android',
    priceINR: 59999,
    year: 2024,
    chipset: 'Snapdragon 8 Gen 3',
    screenInches: 6.82,
    displayType: 'LTPO AMOLED',
    refreshHz: 120,
    specs: { processorScore: 96, ramGB: 12, batteryPower: 5400, cameraRating: 86, storageGB: 256, displayScore: 95 },
    purposeNotes: {
      gaming: ['Top-3 Android GPU performance', '120 Hz with smart frame rate'],
      camera: ['Hasselblad 50 MP triple cam', '3x periscope telephoto'],
      battery: ['5400 mAh + 100 W charge', '50 W wireless charging'],
      media: ['2K ProXDR 4500-nit display', 'Dolby Vision + hi-res audio'],
      everyday: ['Everything-on-board flagship', '100 W + 50 W wireless'],
    },
    pros: ['Best-in-class battery + 100 W', 'Gorgeous 2K LTPO display', 'Hasselblad cameras with 3x zoom'],
    cons: ['Large in the pocket', 'No S Pen-style extras'],
  },
  {
    id: 'galaxy-s24',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    os: 'Android',
    priceINR: 67999,
    year: 2024,
    chipset: 'Snapdragon 8 Gen 3',
    screenInches: 6.2,
    displayType: 'Dynamic AMOLED 2X',
    refreshHz: 120,
    specs: { processorScore: 95, ramGB: 8, batteryPower: 4000, cameraRating: 88, storageGB: 256, displayScore: 93 },
    purposeNotes: {
      gaming: ['8 Gen 3 with ray tracing', 'Cool, sustained frame rates'],
      camera: ['50 MP with Galaxy AI editing', '50 MP 3x and 8K video'],
      battery: ['Efficient 4 nm battery life', '45 W + 15 W wireless'],
      media: ['2600-nit Vision Booster', 'QHD+ 120 Hz flat panel'],
      everyday: ['Galaxy AI in a compact body', '7 years of updates'],
    },
    pros: ['Compact flagship with big power', 'Galaxy AI features', '7 years of OS updates'],
    cons: ['45 W charging is merely OK', 'Battery smaller than rivals'],
  },
  {
    id: 'iphone-16',
    name: 'Apple iPhone 16',
    brand: 'Apple',
    os: 'iOS',
    priceINR: 79900,
    year: 2024,
    chipset: 'A18',
    screenInches: 6.1,
    displayType: 'OLED',
    refreshHz: 60,
    specs: { processorScore: 96, ramGB: 8, batteryPower: 3561, cameraRating: 89, storageGB: 128, displayScore: 91 },
    purposeNotes: {
      gaming: ['A18 runs console ports', 'Ray tracing at full tilt'],
      camera: ['4K60 Dolby Vision video', 'Camera Control + Photographic Styles'],
      battery: ['All-day-plus battery life', 'MagSafe wireless charging'],
      media: ['Super Retina XDR OLED', 'Spatial Audio speakers'],
      everyday: ['Apple Intelligence ready', 'Action button + USB-C'],
    },
    pros: ['Blazing A18 chip', 'Best video recording in class', 'Years of iOS updates'],
    cons: ['60 Hz display at this price', '128 GB base storage'],
  },
  {
    id: 'pixel-9-pro',
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    os: 'Android',
    priceINR: 99999,
    year: 2024,
    chipset: 'Tensor G4',
    screenInches: 6.3,
    displayType: 'LTPO OLED',
    refreshHz: 120,
    specs: { processorScore: 88, ramGB: 16, batteryPower: 4700, cameraRating: 97, storageGB: 256, displayScore: 94 },
    purposeNotes: {
      gaming: ['Plays everything smoothly', '120 Hz adaptive panel'],
      camera: ['50 MP + 48 MP UW + 5x tele', 'Best-in-class Night Sight'],
      battery: ['4700 mAh + 45 W charging', 'Adaptive battery AI'],
      media: ['Super Actua 3000-nit display', '256 GB base storage'],
      everyday: ['Gemini AI everywhere', '7 years of updates'],
    },
    pros: ['The camera benchmark', '7 years of updates', 'Bright, colour-true display'],
    cons: ['Tensor trails in raw speed', 'Charging capped at 45 W'],
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    os: 'Android',
    priceINR: 124999,
    year: 2024,
    chipset: 'Snapdragon 8 Gen 3',
    screenInches: 6.8,
    displayType: 'Dynamic AMOLED 2X',
    refreshHz: 120,
    specs: { processorScore: 96, ramGB: 12, batteryPower: 5000, cameraRating: 97, storageGB: 256, displayScore: 97 },
    purposeNotes: {
      gaming: ['Desktop-class sustained GPU', '2600-nit 120 Hz panel'],
      camera: ['200 MP main + 5x periscope', '8K video & AI editing'],
      battery: ['5000 mAh marathon battery', '45 W + 15 W wireless'],
      media: ['Best-in-class 6.8" display', 'S Pen for notes & sketches'],
      everyday: ['The everything phone', 'Titanium build + S Pen'],
    },
    pros: ['Versatile quad camera with 5x', 'S Pen built in', 'Top-tier display and speakers'],
    cons: ['Very expensive', 'Big and heavy in the hand'],
  },
  {
    id: 'iphone-16-pro',
    name: 'Apple iPhone 16 Pro',
    brand: 'Apple',
    os: 'iOS',
    priceINR: 139900,
    year: 2024,
    chipset: 'A18 Pro',
    screenInches: 6.3,
    displayType: 'ProMotion OLED',
    refreshHz: 120,
    specs: { processorScore: 99, ramGB: 8, batteryPower: 3582, cameraRating: 97, storageGB: 256, displayScore: 96 },
    purposeNotes: {
      gaming: ['A18 Pro — the fastest mobile GPU', 'AAA titles at full settings'],
      camera: ['4K120 Dolby Vision video', '5x tele + 48 MP Fusion camera'],
      battery: ['All-day Pro battery', 'MagSafe + Qi2 charging'],
      media: ['ProMotion 120 Hz XDR display', 'Studio-quality mics & speakers'],
      everyday: ['Titanium light, Pro capable', 'Camera Control + USB-C 3'],
    },
    pros: ['Industry-leading video capture', '5x optical telephoto', 'A18 Pro performance ceiling'],
    cons: ['Premium price tag', 'Still no charger in the box'],
  },
];

// ── Purpose scoring (pure functions, 0–100 composites) ─────────────────────
const normRam = (gb) => Math.min(gb / 12, 1) * 100;
const normBattery = (mah) => Math.min(mah / 6000, 1) * 100;
const normStorage = (gb) => Math.min(gb / 512, 1) * 100;
const normHz = (hz) => Math.min(hz / 144, 1) * 100;

export const scoringRules = {
  // Raw GPU/CPU headroom + RAM + high-refresh panels for smooth gameplay
  gaming: (p) =>
    p.specs.processorScore * 0.55 + normRam(p.specs.ramGB) * 0.2 + normHz(p.refreshHz) * 0.1 + normBattery(p.specs.batteryPower) * 0.15,

  // Camera composite first; ISP (chip) and storage (4K video) support it
  camera: (p) =>
    p.specs.cameraRating * 0.75 + p.specs.processorScore * 0.15 + normStorage(p.specs.storageGB) * 0.1,

  // Endurance for workdays: battery capacity + efficiency + multitasking RAM
  battery: (p) =>
    normBattery(p.specs.batteryPower) * 0.55 + p.specs.processorScore * 0.25 + normRam(p.specs.ramGB) * 0.2,

  // Binge-watching: panel quality first, then endurance + storage for media
  media: (p) =>
    p.specs.displayScore * 0.6 + normBattery(p.specs.batteryPower) * 0.2 + normStorage(p.specs.storageGB) * 0.1 + normHz(p.refreshHz) * 0.1,

  // Balanced: nothing should be weak
  everyday: (p) =>
    p.specs.processorScore * 0.25 + p.specs.cameraRating * 0.25 + normBattery(p.specs.batteryPower) * 0.25 + p.specs.displayScore * 0.25,
};

export const scorePhone = (phone, purposeKey) =>
  Math.round((scoringRules[purposeKey] || scoringRules.everyday)(phone));

// ── Derived helpers ────────────────────────────────────────────────────────
export const tierOf = (phone) => {
  if (phone.priceINR < 20000) return 'entry';
  if (phone.priceINR <= 50000) return 'mid';
  return 'flagship';
};

export const sizeOf = (phone) => (phone.screenInches <= 6.3 ? 'compact' : phone.screenInches >= 6.6 ? 'large' : 'standard');

// ── Step 3 · Recommendation engine ────────────────────────────────────────
//  Filters by budget tier + optional OS / screen-size preferences, scores by
//  the selected purpose and returns the top 3–4 matches.
//
//  Relaxation policy:
//   · Screen size is a soft preference — dropped first if it leaves < 3 matches.
//   · OS is a hard preference — never replaced while any match honours it;
//     only if an OS yields zero phones does the search fall back to all OSes.
export function getRecommendations({ purpose, budget, os = 'any', size = 'any' }) {
  const tier = budgetMeta(budget);
  const relaxed = [];

  const build = (filter) =>
    phones
      .filter(filter)
      .map((p) => ({ phone: p, match: scorePhone(p, purpose) }))
      .sort((a, b) => b.match - a.match);

  const inTier = (p) => tier.matches(p);
  const osOk = (p) => os === 'any' || p.os === os;
  const sizeOk = (p) => {
    if (size === 'any') return true;
    const s = sizeOf(p);
    return s === size || (size === 'large' ? s === 'standard' : false);
  };

  let list = build((p) => inTier(p) && osOk(p) && sizeOk(p));

  // Soft preference: widen screen size before touching anything else
  if (list.length < 3 && size !== 'any') {
    const grown = build((p) => inTier(p) && osOk(p));
    if (grown.length > list.length) {
      list = grown;
      relaxed.push('screen size');
    }
  }

  // Hard preference: only fall back on OS when it yields nothing at all
  if (list.length === 0 && os !== 'any') {
    const grown = build((p) => inTier(p));
    if (grown.length > 0) {
      list = grown;
      relaxed.push('OS');
    }
  }

  return { list: list.slice(0, 4), relaxed };
}

// ── Brand monogram tones (muted, used in the placeholder visuals) ──────────
export const brandTones = {
  Apple: '#B7BDC9',
  Samsung: '#8FB4EC',
  Google: '#93C4A6',
  OnePlus: '#E58B7B',
  Nothing: '#B9B9C4',
  Motorola: '#B7A6E0',
  Poco: '#E0B85A',
  Redmi: '#E08E79',
  iQOO: '#7FA4E0',
};
