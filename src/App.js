// =============================================================================
//  src/App.js — PhoneMatrix: Smart Mobile Comparison Engine
//  React 16.5 · Hooks: useState, useMemo, useEffect
//  Navigation: state-driven { page: 'home' | 'comparison', id: null }
//  No react-router-dom · No createRoot (React 16 ReactDOM.render in index.js)
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  phones,
  brandMeta,
  allBrands,
  scoringRules,
  PRIORITIES,
} from './data/mockDatabase';

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number to Indian Rupee display (e.g. 79900 → ₹79,900) */
const inrFormat = (n) =>
  '₹' + n.toLocaleString('en-IN');

/** Clamp a value between min and max */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Return the brand accent colour from brandMeta (fallback slate) */
const brandColor = (brand) => (brandMeta[brand] ? brandMeta[brand].color : '#64748b');

/** Star rating renderer */
const Stars = ({ score }) => {
  const pct = clamp(Math.round(score), 0, 100);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <i
          key={s}
          className={`fa-star text-xs ${
            pct >= s * 20 ? 'fa-solid text-yellow-400' : 'fa-regular text-slate-600'
          }`}
        />
      ))}
      <span className="text-slate-400 text-xs ml-1">{pct}%</span>
    </div>
  );
};

/** Small spec badge pill */
const SpecPill = ({ icon, label, value, accent }) => (
  <div
    className="flex items-center gap-2 rounded-xl px-3 py-2 glass"
    style={{ borderColor: accent + '30' }}
  >
    <i className={`${icon} text-sm`} style={{ color: accent }} />
    <div className="min-w-0">
      <p className="text-slate-400 text-xs leading-none mb-0.5">{label}</p>
      <p className="text-slate-100 text-sm font-semibold leading-none truncate">{value}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

const Navbar = ({ compareList, onGoCompare, onHome }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
      {/* Logo */}
      <button
        onClick={onHome}
        className="flex items-center gap-2.5 group"
        id="nav-logo-home"
      >
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-lg shadow-brand/40 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-layer-group text-white text-sm" />
        </div>
        <span className="font-bold text-base tracking-tight gradient-text">PhoneMatrix</span>
      </button>

      {/* Compare Tray CTA */}
      <button
        id="nav-compare-btn"
        onClick={compareList.length === 2 ? onGoCompare : undefined}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
          compareList.length === 2
            ? 'bg-brand hover:bg-brand/80 text-white tray-glow cursor-pointer animate-pulse-soft'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
        title={compareList.length < 2 ? 'Select 2 phones to compare' : 'Compare now'}
      >
        <i className="fa-solid fa-code-compare" />
        Compare
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
            compareList.length === 2 ? 'bg-white text-brand' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {compareList.length}/2
        </span>
      </button>
    </div>
  </nav>
);

// ─────────────────────────────────────────────────────────────────────────────
//  PHONE CARD  (used in the unified grid)
// ─────────────────────────────────────────────────────────────────────────────

const PhoneCard = ({ phone, inCompare, onToggleCompare, matchScore }) => {
  const accent = brandColor(phone.brand);
  const icon = (brandMeta[phone.brand] && brandMeta[phone.brand].icon) || 'fa-solid fa-mobile';
  const isMax = inCompare; // visually selected

  return (
    <div
      id={`card-${phone.id}`}
      className={`relative rounded-2xl p-5 flex flex-col gap-4 card-hover glass transition-all duration-300 ${
        isMax ? 'ring-2' : 'ring-0'
      }`}
      style={isMax ? { ringColor: accent, boxShadow: `0 0 0 2px ${accent}` } : {}}
    >
      {/* Match score ribbon — only shown when recommendation engine is active */}
      {matchScore !== undefined && (
        <div
          className="absolute -top-2 -right-2 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-lg"
          style={{ background: accent }}
        >
          {Math.round(matchScore)}% match
        </div>
      )}

      {/* Brand + Year */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${icon} text-lg`} style={{ color: accent }} />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {phone.brand}
          </span>
        </div>
        <span className="text-xs text-slate-600 font-medium">{phone.year}</span>
      </div>

      {/* Name + Price */}
      <div>
        <h3 className="text-slate-100 font-bold text-base leading-snug">{phone.name}</h3>
        <p className="font-bold text-lg mt-0.5" style={{ color: accent }}>
          {inrFormat(phone.priceINR)}
        </p>
      </div>

      {/* Key Specs grid */}
      <div className="grid grid-cols-2 gap-2">
        <SpecPill icon="fa-solid fa-microchip"   label="Chip Score"  value={`${phone.specs.processorScore}/100`} accent={accent} />
        <SpecPill icon="fa-solid fa-memory"      label="RAM"         value={`${phone.specs.ramGB} GB`}           accent={accent} />
        <SpecPill icon="fa-solid fa-battery-full" label="Battery"    value={`${phone.specs.batteryPower} mAh`}   accent={accent} />
        <SpecPill icon="fa-solid fa-camera"      label="Cam Score"   value={`${phone.specs.cameraRating}/100`}   accent={accent} />
      </div>

      {/* Display type tag & Rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-display text-slate-500 text-xs" />
          <span className="text-slate-400 text-xs">{phone.specs.displayType}</span>
        </div>
        <Stars score={phone.specs.cameraRating} />
      </div>

      {/* Highlights */}
      <div className="flex flex-wrap gap-1.5">
        {phone.highlights.slice(0, 3).map((h) => (
          <span
            key={h}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: accent + '18', color: accent }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Compare toggle */}
      <button
        id={`compare-toggle-${phone.id}`}
        onClick={() => onToggleCompare(phone)}
        className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          isMax
            ? 'text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }`}
        style={isMax ? { background: accent } : {}}
      >
        {isMax ? (
          <>
            <i className="fa-solid fa-check mr-2" />
            Added to Tray
          </>
        ) : (
          <>
            <i className="fa-solid fa-plus mr-2 text-slate-400" />
            Add to Compare
          </>
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  SMART MATCH BANNER  (top recommendation callout)
// ─────────────────────────────────────────────────────────────────────────────

const SmartMatchBanner = ({ phone, score, priority, onAddToCompare, inCompare }) => {
  if (!phone) return null;
  const accent = brandColor(phone.brand);
  const pct = Math.round(clamp(score, 0, 100));
  const priorityMeta = PRIORITIES.find((p) => p.key === priority);

  return (
    <div
      id="smart-match-banner"
      className="rounded-2xl p-6 glass animate-fade-up relative overflow-hidden"
      style={{ border: `1.5px solid ${accent}50` }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 50%, ${accent} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Icon block */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${accent}60, ${accent}20)`, border: `1px solid ${accent}50` }}
        >
          <i
            className={`${(brandMeta[phone.brand] && brandMeta[phone.brand].icon) || 'fa-solid fa-mobile'} text-3xl`}
            style={{ color: accent }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Our Top Smart Match For You
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: (priorityMeta && priorityMeta.color) || accent }}
            >
              <i className={`${priorityMeta && priorityMeta.icon} mr-1`} />
              {priorityMeta && priorityMeta.label}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 leading-tight">{phone.name}</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {phone.brand} · {phone.year} · {inrFormat(phone.priceINR)}
          </p>

          {/* Match % bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full shimmer-bar rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white whitespace-nowrap">
              Matches {pct}% of your needs
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          id="smart-match-add-compare"
          onClick={() => onAddToCompare(phone)}
          disabled={inCompare}
          className="flex-shrink-0 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          style={{ background: inCompare ? '#334155' : accent }}
        >
          {inCompare ? (
            <><i className="fa-solid fa-check mr-2" />In Tray</>
          ) : (
            <><i className="fa-solid fa-plus mr-2" />Add to Compare</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  HOME VIEW
// ─────────────────────────────────────────────────────────────────────────────

const HomeView = ({ compareList, onToggleCompare }) => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeBrands, setActiveBrands] = useState(new Set(allBrands)); // all on by default
  const [priority, setPriority] = useState('gaming');
  const [maxBudget, setMaxBudget] = useState(150000);

  // ── Toggle a brand filter chip ────────────────────────────────────────────
  const toggleBrand = (brand) => {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        if (next.size === 1) return prev; // keep at least one brand
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  // ── Step 1: Base filter — brand checkbox + search + budget ────────────────
  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return phones.filter((p) => {
      const matchesBrand  = activeBrands.has(p.brand);
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      const matchesBudget = p.priceINR <= maxBudget;
      return matchesBrand && matchesSearch && matchesBudget;
    });
  }, [search, activeBrands, maxBudget]);

  // ── Step 2: Score every phone using the selected scoring rule ─────────────
  //
  //  scoringRules[priority](phone) returns a raw composite score (0–100).
  //  We then normalise scores relative to the max scorer in the current
  //  filtered set so the banner always shows a meaningful percentage —
  //  even if the absolute score is low (e.g. budget mode gives low raw numbers).
  //
  //  Final % = (rawScore / maxRawScore) * 100
  //
  const scoredPhones = useMemo(() => {
    const rule = scoringRules[priority];
    const scored = baseFiltered.map((p) => ({ ...p, _score: rule(p) }));

    // Normalise so the best phone always reads ≈100% match
    const maxScore = Math.max(...scored.map((p) => p._score), 1);
    return scored
      .map((p) => ({ ...p, _normScore: (p._score / maxScore) * 100 }))
      .sort((a, b) => b._score - a._score); // descending — best first
  }, [baseFiltered, priority]);

  const topPhone = scoredPhones[0] || null;

  return (
    <div className="min-h-screen">
      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <div className="pt-28 pb-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-fade-up">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand px-3 py-1 rounded-full bg-brand/10 mb-4">
            Multi-Brand Unified Engine
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-100 leading-tight">
            Find Your{' '}
            <span className="gradient-text">Perfect Phone</span>
          </h1>
          <p className="mt-3 text-slate-400 text-base max-w-xl mx-auto">
            Compare {phones.length} smartphones across {allBrands.length} brands with
            our real-time smart scoring engine.
          </p>
        </div>

        {/* ── CONTROL BAR ────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-5 mb-8 animate-fade-up flex flex-col gap-5">
          {/* Row 1: Search + Brand chips */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
              <input
                id="phone-search"
                type="text"
                placeholder="Search phones or brands…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/60 transition"
              />
            </div>

            {/* Brand filter chips */}
            <div className="flex flex-wrap gap-2">
              {allBrands.map((brand) => {
                const active = activeBrands.has(brand);
                const acc = brandColor(brand);
                return (
                  <button
                    key={brand}
                    id={`brand-filter-${brand.toLowerCase()}`}
                    onClick={() => toggleBrand(brand)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={
                      active
                        ? { background: acc + '25', color: acc, border: `1.5px solid ${acc}60` }
                        : { background: '#1e293b', color: '#64748b', border: '1.5px solid #334155' }
                    }
                  >
                    <i className={`${(brandMeta[brand] && brandMeta[brand].icon) || 'fa-solid fa-mobile'} text-xs`} />
                    {brand}
                    {active && <i className="fa-solid fa-check text-[10px] ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Priority selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2.5">
              <i className="fa-solid fa-sliders mr-1.5" />
              Your Priority
            </p>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((pr) => (
                <button
                  key={pr.key}
                  id={`priority-${pr.key}`}
                  onClick={() => setPriority(pr.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    priority === pr.key
                      ? { background: pr.color + '25', color: pr.color, border: `1.5px solid ${pr.color}70` }
                      : { background: '#1e293b', color: '#64748b', border: '1.5px solid #334155' }
                  }
                >
                  <i className={pr.icon} />
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Budget slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                <i className="fa-solid fa-indian-rupee-sign mr-1.5" />
                Max Budget
              </p>
              <span className="text-sm font-bold text-brand">{inrFormat(maxBudget)}</span>
            </div>
            <input
              id="budget-slider"
              type="range"
              min={15000}
              max={150000}
              step={1000}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>₹15,000</span>
              <span>₹1,50,000</span>
            </div>
          </div>
        </div>

        {/* ── SMART MATCH BANNER ─────────────────────────────────────────── */}
        {topPhone && (
          <div className="mb-8 animate-fade-up">
            <SmartMatchBanner
              phone={topPhone}
              score={topPhone._normScore}
              priority={priority}
              onAddToCompare={onToggleCompare}
              inCompare={compareList.some((c) => c.id === topPhone.id)}
            />
          </div>
        )}

        {/* ── UNIFIED PHONE GRID ─────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-slate-300 font-bold text-base">
            <i className="fa-solid fa-list-ul mr-2 text-brand" />
            All Phones
            <span className="ml-2 text-slate-500 font-normal text-sm">
              ({scoredPhones.length} result{scoredPhones.length !== 1 ? 's' : ''})
            </span>
          </h2>
          {compareList.length > 0 && (
            <div className="flex items-center gap-2">
              {compareList.map((p) => (
                <span
                  key={p.id}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: brandColor(p.brand) + '25', color: brandColor(p.brand) }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {scoredPhones.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <i className="fa-solid fa-circle-xmark text-5xl mb-4 block" />
            <p className="font-semibold">No phones match your filters.</p>
            <p className="text-sm mt-1">Try raising the budget or enabling more brands.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-up">
            {scoredPhones.map((phone) => (
              <PhoneCard
                key={phone.id}
                phone={phone}
                inCompare={compareList.some((c) => c.id === phone.id)}
                onToggleCompare={onToggleCompare}
                matchScore={phone._normScore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPARISON VIEW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ComparisonRow — renders one spec comparison row.
 * Highlights the winner cell with green and the loser with slate.
 *
 * @param {string}  label        - Row label
 * @param {string}  icon         - FontAwesome class
 * @param {*}       valueA       - Value for phone A (can be number or string)
 * @param {*}       valueB       - Value for phone B
 * @param {boolean} higherWins   - true = higher number is better; false = lower is better (e.g. price)
 * @param {string}  unit         - Optional suffix (e.g. " GB", " mAh")
 */
const ComparisonRow = ({ label, icon, valueA, valueB, higherWins = true, unit = '' }) => {
  // Only run winner logic for numeric values
  const aNum = parseFloat(valueA);
  const bNum = parseFloat(valueB);
  const numeric = !isNaN(aNum) && !isNaN(bNum);

  let aWins = false;
  let bWins = false;
  if (numeric && aNum !== bNum) {
    aWins = higherWins ? aNum > bNum : aNum < bNum;
    bWins = !aWins;
  }

  const cellBase = 'flex-1 px-4 py-3.5 text-sm font-semibold text-center transition-all duration-300 rounded-xl';

  return (
    <div className="flex items-stretch gap-3 mb-2" id={`row-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      {/* Left value — Phone A */}
      <div
        className={`${cellBase} ${
          aWins ? 'spec-win text-green-300' : 'spec-lose text-slate-300'
        }`}
      >
        {aWins && <i className="fa-solid fa-crown text-yellow-400 text-xs mr-1" />}
        {valueA}{unit}
      </div>

      {/* Label column */}
      <div className="w-40 flex-shrink-0 flex flex-col items-center justify-center gap-1">
        <i className={`${icon} text-slate-500 text-sm`} />
        <span className="text-xs text-slate-500 font-medium text-center leading-tight">{label}</span>
      </div>

      {/* Right value — Phone B */}
      <div
        className={`${cellBase} ${
          bWins ? 'spec-win text-green-300' : 'spec-lose text-slate-300'
        }`}
      >
        {bWins && <i className="fa-solid fa-crown text-yellow-400 text-xs mr-1" />}
        {valueB}{unit}
      </div>
    </div>
  );
};

const ComparisonView = ({ compareList, onBack, onToggleCompare }) => {
  const [phoneA, phoneB] = compareList;

  if (!phoneA || !phoneB) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <i className="fa-solid fa-code-compare text-6xl text-slate-700" />
        <p className="text-slate-400 font-semibold">Select 2 phones to compare.</p>
        <button
          id="back-to-home-empty"
          onClick={onBack}
          className="mt-2 px-6 py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand/80 transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const accentA = brandColor(phoneA.brand);
  const accentB = brandColor(phoneB.brand);

  const rows = [
    { label: 'Price (INR)',    icon: 'fa-solid fa-indian-rupee-sign', valueA: phoneA.priceINR,          valueB: phoneB.priceINR,          higherWins: false, unit: '' },
    { label: 'Chip Score',    icon: 'fa-solid fa-microchip',          valueA: phoneA.specs.processorScore, valueB: phoneB.specs.processorScore, higherWins: true,  unit: '/100' },
    { label: 'RAM',           icon: 'fa-solid fa-memory',             valueA: phoneA.specs.ramGB,           valueB: phoneB.specs.ramGB,           higherWins: true,  unit: ' GB' },
    { label: 'Battery',       icon: 'fa-solid fa-battery-full',       valueA: phoneA.specs.batteryPower,    valueB: phoneB.specs.batteryPower,    higherWins: true,  unit: ' mAh' },
    { label: 'Camera Rating', icon: 'fa-solid fa-camera',             valueA: phoneA.specs.cameraRating,    valueB: phoneB.specs.cameraRating,    higherWins: true,  unit: '/100' },
    { label: 'Storage',       icon: 'fa-solid fa-hard-drive',         valueA: phoneA.specs.storageGB,       valueB: phoneB.specs.storageGB,       higherWins: true,  unit: ' GB' },
  ];

  const scoreA = scoringRules.gaming(phoneA);
  const scoreB = scoringRules.gaming(phoneB);
  const overallWinnerA = scoreA >= scoreB;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto animate-fade-up">
      {/* Back button */}
      <button
        id="back-to-dashboard"
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-brand transition-colors group"
      >
        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
        Back to Unified Engine Dashboard
      </button>

      <h1 className="text-3xl font-black text-slate-100 mb-2">
        <span className="gradient-text">Side-by-Side</span> Comparison
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        Green rows indicate the superior specification. Crown icon marks the outright winner.
      </p>

      {/* Phone header cards */}
      <div className="flex items-stretch gap-4 mb-6">
        {/* Spacer for label column */}
        <div className="hidden sm:block w-40 flex-shrink-0" />

        {[phoneA, phoneB].map((phone, idx) => {
          const acc = idx === 0 ? accentA : accentB;
          const isWinner = idx === 0 ? overallWinnerA : !overallWinnerA;
          return (
            <div
              key={phone.id}
              id={`compare-header-${phone.id}`}
              className="flex-1 glass rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ border: `1.5px solid ${acc}50` }}
            >
              {isWinner && (
                <div className="absolute top-0 left-0 right-0 flex justify-center">
                  <span
                    className="text-xs font-bold px-3 py-0.5 text-white rounded-b-xl"
                    style={{ background: acc }}
                  >
                    <i className="fa-solid fa-trophy mr-1" />
                    Overall Leader
                  </span>
                </div>
              )}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mt-4 mb-3"
                style={{ background: acc + '20', border: `1px solid ${acc}40` }}
              >
                <i
                  className={`${(brandMeta[phone.brand] && brandMeta[phone.brand].icon) || 'fa-solid fa-mobile'} text-2xl`}
                  style={{ color: acc }}
                />
              </div>
              <h2 className="font-bold text-slate-100 text-base">{phone.name}</h2>
              <p className="text-sm font-bold mt-1" style={{ color: acc }}>
                {inrFormat(phone.priceINR)}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{phone.brand} · {phone.year}</p>

              {/* Remove from compare */}
              <button
                id={`remove-compare-${phone.id}`}
                onClick={() => onToggleCompare(phone)}
                className="mt-3 text-xs text-slate-600 hover:text-red-400 transition-colors"
              >
                <i className="fa-solid fa-xmark mr-1" />
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* Spec rows */}
      <div className="glass rounded-2xl p-5">
        {/* Header labels */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="hidden sm:block w-40 flex-shrink-0" />
          <div className="flex-1 text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentA }}>
              {phoneA.name}
            </span>
          </div>
          <div className="w-40 flex-shrink-0 hidden sm:block" />
          <div className="flex-1 text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentB }}>
              {phoneB.name}
            </span>
          </div>
        </div>

        {rows.map((row) => (
          <ComparisonRow key={row.label} {...row} />
        ))}

        {/* Display type — text comparison (no winner) */}
        <div className="flex items-stretch gap-3 mt-2">
          <div className="flex-1 px-4 py-3.5 text-sm font-semibold text-center spec-lose text-slate-300 rounded-xl">
            {phoneA.specs.displayType}
          </div>
          <div className="w-40 flex-shrink-0 flex flex-col items-center justify-center gap-1">
            <i className="fa-solid fa-display text-slate-500 text-sm" />
            <span className="text-xs text-slate-500 font-medium text-center">Display Type</span>
          </div>
          <div className="flex-1 px-4 py-3.5 text-sm font-semibold text-center spec-lose text-slate-300 rounded-xl">
            {phoneB.specs.displayType}
          </div>
        </div>
      </div>

      {/* Highlights comparison */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {[phoneA, phoneB].map((phone, idx) => {
          const acc = idx === 0 ? accentA : accentB;
          return (
            <div key={phone.id} className="glass rounded-2xl p-4">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: acc }}
              >
                {phone.name} Highlights
              </p>
              <ul className="space-y-2">
                {phone.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-slate-300">
                    <i className="fa-solid fa-circle-check text-xs" style={{ color: acc }} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bottom back button */}
      <div className="mt-10 text-center">
        <button
          id="back-to-dashboard-bottom"
          onClick={onBack}
          className="px-8 py-3.5 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand/80 transition-all duration-200 hover:shadow-lg hover:shadow-brand/30"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Back to Unified Engine Dashboard
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP — navigation controller + global compare tray state
// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
  // ── Navigation state ──────────────────────────────────────────────────────
  const [view, setView] = useState({ page: 'home', id: null });

  // ── Global compare tray — max 2 phones ───────────────────────────────────
  const [compareList, setCompareList] = useState([]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view.page]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const navigateTo = (page, id = null) => setView({ page, id });

  // ── Compare tray toggle ───────────────────────────────────────────────────
  //  Rules:
  //   1. If the phone is already in the list → remove it.
  //   2. If the list has 2 items → replace the oldest one (FIFO swap).
  //   3. Otherwise → append.
  const handleToggleCompare = (phone) => {
    setCompareList((prev) => {
      const exists = prev.findIndex((p) => p.id === phone.id);
      if (exists !== -1) {
        // Remove from tray
        return prev.filter((p) => p.id !== phone.id);
      }
      if (prev.length === 2) {
        // Swap out the oldest (index 0) — FIFO
        return [prev[1], phone];
      }
      return [...prev, phone];
    });
  };

  const handleGoCompare = () => navigateTo('comparison');
  const handleHome = () => navigateTo('home');

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar
        compareList={compareList}
        onGoCompare={handleGoCompare}
        onHome={handleHome}
      />

      {view.page === 'home' && (
        <HomeView
          compareList={compareList}
          onToggleCompare={handleToggleCompare}
        />
      )}

      {view.page === 'comparison' && (
        <ComparisonView
          compareList={compareList}
          onBack={handleHome}
          onToggleCompare={handleToggleCompare}
        />
      )}
    </div>
  );
};

export default App;
