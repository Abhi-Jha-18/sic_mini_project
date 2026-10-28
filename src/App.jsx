// =============================================================================
//  src/App.js — PhoneFit: a 3-stage mobile recommendation experience
//
//  STAGE 1 · Landing page    — headline + purpose prompt
//      "What is the primary purpose or main feature you need in your mobile
//       phone?" → Gaming / Photography-Videography / Daily Work & Battery /
//       Media / General Everyday Use
//
//  STAGE 2 · Inner modal     — INR budget & optional screen-size preference
//  STAGE 3 · Results section — 3–4 ranked cards backed by the client CSV
//      Name, supplied price/specs, purpose-fit notes, and heuristic match score.
//
//  OS/refresh-rate/benchmark filters are omitted because the client dataset does
//  not provide those fields.
// =============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  phones,
  DATASET_META,
  PURPOSES,
  BUDGET_TIERS,
  SIZE_OPTIONS,
  purposeMeta,
  purposeNotesFor,
  budgetMeta,
  getRecommendations,
  brandTones,
} from './data/mockDatabase';

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Prices are localized to Indian rupees for display. */
const inrFormat = (n) => '₹' + n.toLocaleString('en-IN');

/** Tiny classnames helper */
const cx = function () {
  const parts = [];
  for (let i = 0; i < arguments.length; i += 1) if (arguments[i]) parts.push(arguments[i]);
  return parts.join(' ');
};

// ─────────────────────────────────────────────────────────────────────────────
//  PROGRESS TRACKER — visible on every stage (Step n of 3)
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Purpose', 'Budget', 'Matches'];

const ProgressSteps = ({ current }) => (
  <div className="flex items-center gap-2 sm:gap-3" aria-label="Step indicator">
    {STEP_LABELS.map((label, i) => {
      const state = i < current ? 'done' : i === current ? 'active' : 'todo';
      return (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          {i > 0 && (
            <div
              className={cx('h-px w-4 sm:w-8', state === 'todo' ? 'bg-stone-600' : 'bg-accent')}
            />
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cx(
                'w-6 h-6 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center transition-colors',
                state === 'todo' && 'bg-white/10 text-stone-400',
                state === 'active' && 'bg-accent text-white shadow-glow',
                state === 'done' && 'bg-sage/15 text-sage'
              )}
            >
              {state === 'done' ? <i className="fa-solid fa-check text-[9px]" /> : i + 1}
            </span>
            <span
              className={cx(
                'text-xs font-medium tracking-wide hidden sm:block',
                state === 'todo' ? 'text-stone-500' : 'text-stone-300'
              )}
            >
              {label}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────────────────────────────────────────

const TopBar = ({ step, onHome, showHome }) => (
  <header className="sticky top-0 z-40 bg-[#0B0C10]/80 backdrop-blur-xl border-b border-stone-700/80">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
      <button onClick={onHome} className="flex items-center gap-2.5 group" id="logo-home">
        <div
          className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-tile group-hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #4A6785 0%, #54649F 55%, #6B5B8A 100%)' }}
        >
          <i className="fa-solid fa-mobile-screen-button text-sm" />
        </div>
        <span className="font-display font-bold text-[17px] tracking-tight text-ink">
          Phone<span className="text-gradient">Fit</span>
        </span>
      </button>

      <ProgressSteps current={step} />

      {showHome ? (
        <button
          onClick={onHome}
          className="text-sm font-medium text-stone-400 hover:text-accent transition-colors"
        >
          Start over
        </button>
      ) : (
        <div className="w-[72px]" />
      )}
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
//  PHONE IMAGE PLACEHOLDER — clean SVG device mock with brand monogram
// ─────────────────────────────────────────────────────────────────────────────

const PhoneVisual = ({ phone, match, tint }) => {
  const tone = brandTones[phone.brand] || '#64748B';
  return (
    <div
      className="relative h-48 rounded-2xl overflow-hidden flex items-center justify-center"
      style={{
        background:
          'radial-gradient(120% 90% at 18% 0%, ' + tone + '33 0%, transparent 55%), ' +
          'radial-gradient(100% 100% at 96% 100%, ' + tone + '24 0%, transparent 55%), ' +
          'linear-gradient(165deg, #1A1A22 0%, #101014 100%)',
      }}
    >
      {/* Match badge — colour-banded by confidence */}
      {match !== undefined && (
        <span
          className={cx(
            'absolute top-3 right-3 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm',
            match >= 85 ? 'text-sage' : match >= 70 ? 'text-amber-400' : 'text-rose-400'
          )}
        >
          {Math.round(match)}% match
        </span>
      )}

      <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label={phone.name + ' placeholder image'}>
        {/* Device body */}
        <rect x="10" y="4" width="66" height="142" rx="13" fill="#121218" stroke={tone} strokeWidth="2.4" />
        {/* Screen */}
        <rect x="16" y="12" width="54" height="126" rx="8" fill={tone} opacity="0.12" />
        {/* Dynamic island */}
        <rect x="35" y="18" width="16" height="4.5" rx="2.25" fill={tone} opacity="0.55" />
        {/* Camera module */}
        <rect x="22" y="28" width="22" height="22" rx="6" fill={tone} opacity="0.22" />
        <circle cx="29" cy="35" r="3.4" fill={tone} />
        <circle cx="38" cy="35" r="3.4" fill={tone} />
        <circle cx="29" cy="44" r="3.4" fill={tone} opacity="0.55" />
        {/* Brand monogram */}
        <text
          x="43"
          y="95"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="22"
          fontWeight="700"
          fill={tone}
          opacity="0.8"
        >
          {phone.brand.charAt(0)}
        </text>
        {/* Home bar */}
        <rect x="32" y="128" width="22" height="3" rx="1.5" fill={tone} opacity="0.35" />
      </svg>

      {tint && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: tint }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 1 · LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

const PurposeCard = ({ purpose, onSelect }) => (
  <button
    id={'purpose-' + purpose.key}
    onClick={() => onSelect(purpose.key)}
    style={{ '--tint': purpose.tint }}
    className="purpose-card group text-left bg-panel rounded-2xl border border-stone-700 p-6 shadow-sm hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4"
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
      style={{
        background: purpose.tint + '1C',
        color: purpose.tint,
        boxShadow: 'inset 0 0 0 1px ' + purpose.tint + '2E',
      }}
    >
      <i className={purpose.icon} />
    </div>
    <div>
      <h3 className="font-display font-semibold text-ink text-[15px] leading-snug">{purpose.label}</h3>
      <p className="text-stone-400 text-[13px] mt-1 leading-relaxed">{purpose.description}</p>
    </div>
    <div
      className="flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
      style={{ color: purpose.tint }}
    >
      Choose
      <i className="fa-solid fa-arrow-right text-[10px]" />
    </div>
  </button>
);

const LandingStage = ({ onSelectPurpose }) => (
  <main className="max-w-6xl mx-auto px-5 sm:px-8">
    {/* Hero */}
    <section className="text-center pt-16 sm:pt-24 pb-12 sm:pb-16 animate-fade-up">
      <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-accent bg-accent/10 px-3.5 py-1.5 rounded-full">
        <i className="fa-solid fa-compass text-[10px]" />
        Smart phone finder
      </span>
      <h1 className="mt-6 text-4xl sm:text-[60px] leading-[1.05] font-display font-black text-ink">
        Find the phone
        <br />
        that <span className="text-gradient">fits your life.</span>
      </h1>
      <p className="mt-5 text-lg text-stone-400 leading-relaxed max-w-xl mx-auto">
        Skip the endless spec sheets. Answer two quick questions and get a
        shortlist of 3–4 phones tailored to what you actually care about.
      </p>
      {/* Palette hint — one dot per purpose, matching the card accents */}
      <div className="mt-8 flex items-center justify-center gap-2.5" aria-hidden="true">
        {PURPOSES.map((p) => (
          <span key={p.key} className="w-2 h-2 rounded-full" style={{ background: p.tint }} />
        ))}
      </div>
    </section>

    {/* Interactive purpose prompt */}
    <section className="pb-24 animate-fade-up">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">Step 1 · Your priority</p>
        <h2 className="mt-3 text-2xl sm:text-[30px] font-display font-semibold text-ink leading-snug">
          What is the primary purpose or main feature
          <br className="hidden sm:block" /> you need in your mobile phone?
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {PURPOSES.map((p) => (
          <PurposeCard key={p.key} purpose={p} onSelect={onSelectPurpose} />
        ))}
      </div>
    </section>
  </main>
);

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 2 · INNER MODAL — BUDGET & PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

const Segmented = ({ label, options, value, onChange }) => (
  <div>
    <p className="text-xs font-medium text-stone-400 mb-2">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cx(
            'px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-150',
            value === opt.key
              ? 'text-white border-transparent shadow-glow bg-gradient-to-r from-accent to-plum'
              : 'bg-white/[0.03] text-stone-300 border-stone-700 hover:border-accent/50 hover:text-accent'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const PreferencesModal = ({ purpose, prefs, onPrefsChange, onSubmit, onClose, isRefine }) => {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pMeta = purposeMeta(purpose);
  const canSubmit = Boolean(prefs.budget);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Budget and preferences"
        className="relative w-full max-w-lg bg-panel rounded-3xl shadow-2xl animate-modal-in max-h-[92vh] overflow-y-auto"
      >
        {/* Header — softly tinted by the chosen purpose */}
        <div
          className="px-7 pt-7 pb-5 border-b border-stone-800"
          style={{ background: 'linear-gradient(135deg, ' + pMeta.tint + '12 0%, transparent 62%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold tracking-[0.18em] uppercase"
                style={{ color: pMeta.tint }}
              >
                Step 2 of 3 · Budget &amp; preferences
              </p>
              <h2 className="mt-2 text-2xl font-display font-semibold text-ink">
                What's your budget?
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/[0.06] text-stone-400 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          {/* Chosen purpose recap */}
          <div
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1.5"
            style={{ background: pMeta.tint + '14', color: pMeta.tint }}
          >
            <i className={pMeta.icon} />
            For: {pMeta.label}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-7">
          {/* Budget tiers */}
          <div className="space-y-2.5">
            {BUDGET_TIERS.map((tier) => {
              const active = prefs.budget === tier.key;
              const modelCount = phones.filter((phone) => tier.matches(phone)).length;
              return (
                <button
                  key={tier.key}
                  id={'budget-' + tier.key}
                  onClick={() => onPrefsChange({ ...prefs, budget: tier.key })}
                  className={cx(
                    'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all duration-150',
                    active
                      ? 'border-accent bg-accent/10 shadow-glow'
                      : 'border-stone-700 hover:border-stone-500 bg-white/[0.03]'
                  )}
                >
                  <span
                    className={cx(
                      'w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      active
                        ? 'border-transparent text-white shadow-glow bg-gradient-to-br from-accent via-[#54649F] to-plum'
                        : 'border-stone-600 text-transparent'
                    )}
                  >
                    <i className="fa-solid fa-check text-xs" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display font-semibold text-ink text-[15px]">{tier.label}</span>
                      <span className="text-xs font-mono font-semibold text-accent">{tier.range}</span>
                      <span className="text-[11px] text-stone-500">{modelCount} models</span>
                    </span>
                    <span className="block text-xs text-stone-400 mt-0.5">{tier.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="-mt-4 text-[11px] leading-relaxed text-stone-500">
            INR prices are estimates converted from the client USD prices at ₹{DATASET_META.usdToInrRate.toFixed(2)} per USD ({DATASET_META.conversionDate}).
          </p>

          {/* Optional preferences */}
          <div className="pt-5 border-t border-stone-800 space-y-5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-stone-500">
                Optional filters
              </p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <Segmented
              label="Screen size"
              options={SIZE_OPTIONS}
              value={prefs.size}
              onChange={(v) => onPrefsChange({ ...prefs, size: v })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-2 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm font-medium text-stone-400 hover:text-stone-800 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1.5 text-xs" />
            {isRefine ? 'Cancel' : 'Back to purpose'}
          </button>
          <button
            id="submit-preferences"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cx(
              'px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200',
              canSubmit
                ? 'btn-primary'
                : 'bg-white/10 text-stone-500 cursor-not-allowed'
            )}
          >
            {isRefine ? 'Update my matches' : 'See my recommendations'}
            <i className="fa-solid fa-arrow-right ml-2 text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 3 · RESULT CARD
// ─────────────────────────────────────────────────────────────────────────────

const TIER_CHIP = {
  entry: 'text-sage bg-sage/10',
  mid: 'text-amber-300 bg-amber-300/10',
  flagship: 'text-plum bg-plum/10',
};

const ResultCard = ({ entry, purpose }) => {
  const phone = entry.phone;
  const pMeta = purposeMeta(purpose);
  const notes = purposeNotesFor(phone)[purpose] || [];
  const tierKey = phone.priceINR < 20000 ? 'entry' : phone.priceINR <= 50000 ? 'mid' : 'flagship';
  const tierLabel = budgetMeta(tierKey).label;
  const storageLabel = phone.storageGB >= 1024
    ? `${phone.storageGB / 1024} TB`
    : `${phone.storageGB} GB`;
  const cameraLabel = phone.cameraMP > 0 ? `${phone.cameraMP} MP` : 'Not listed';

  return (
    <article className="bg-panel rounded-3xl border border-stone-700 shadow-sm hover:shadow-lift transition-all duration-200 p-5 flex flex-col gap-5">
      <PhoneVisual phone={phone} match={entry.match} tint={pMeta.tint} />

      {/* Name + client-supplied price */}
      <div>
        <h3 className="font-display font-semibold text-ink text-lg leading-snug">{phone.name}</h3>
        <p className="text-xs font-mono text-stone-500 mt-1">
          {phone.brand} · {phone.processor || 'Processor not listed'}
        </p>
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-xl font-mono font-bold tracking-tight text-ink">
            {inrFormat(phone.priceINR)}
          </span>
          <span className={cx('text-[11px] font-semibold rounded-full px-2 py-0.5', TIER_CHIP[tierKey])}>
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Purpose-fit notes are generated from fields present in the CSV */}
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-2.5" style={{ color: pMeta.tint }}>
          Why it fits {pMeta.label.split('/')[0]}
        </p>
        <ul className="space-y-1.5">
          {notes.map((note) => (
            <li key={note} className="flex items-start gap-2 text-[13px] text-stone-300 leading-relaxed">
              <i className="fa-solid fa-circle text-[5px] mt-1.5" style={{ color: pMeta.tint }} />
              {note}
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[11px] font-mono text-stone-500">
          {phone.batteryMah.toLocaleString()} mAh · {phone.ramGB} GB RAM · {phone.screenInches}" {phone.displayType}
        </p>
      </div>

      {/* Display source fields as facts; the client data has no editorial pros/cons. */}
      <div className="pt-4 border-t border-stone-800 mt-auto">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-400 mb-2">Client-listed specs</p>
        <ul className="space-y-1.5 text-[13px] text-stone-300 leading-relaxed">
          <li>Customer rating: {phone.rating}/5</li>
          <li>Camera resolution: {cameraLabel}</li>
          <li>Storage: {storageLabel} · Weight: {phone.weightGrams} g</li>
        </ul>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 3 · RESULTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const ResultsStage = ({ purpose, prefs, results, onRefine, onRestart }) => {
  const pMeta = purposeMeta(purpose);
  const bMeta = budgetMeta(prefs.budget);
  const sizeLabel = prefs.size === 'any'
    ? null
    : prefs.size === 'compact'
      ? 'Compact screen'
      : 'Large screen';
  const [browseAll, setBrowseAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('any');
  const [sortBy, setSortBy] = useState('match');
  const [visibleCount, setVisibleCount] = useState(12);
  const brandOptions = useMemo(
    () => [...new Set(results.list.map(({ phone }) => phone.brand))].sort((a, b) => a.localeCompare(b)),
    [results.list]
  );
  const exploredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = results.list.filter(({ phone }) => {
      const matchesText = !query || phone.name.toLowerCase().includes(query) || phone.brand.toLowerCase().includes(query);
      return matchesText && (brandFilter === 'any' || phone.brand === brandFilter);
    });
    if (sortBy === 'price') matches.sort((a, b) => a.phone.priceINR - b.phone.priceINR || b.match - a.match);
    if (sortBy === 'rating') matches.sort((a, b) => b.phone.rating - a.phone.rating || b.match - a.match);
    if (sortBy === 'battery') matches.sort((a, b) => b.phone.batteryMah - a.phone.batteryMah || b.match - a.match);
    return matches;
  }, [results.list, searchQuery, brandFilter, sortBy]);
  const visibleResults = browseAll
    ? exploredResults.slice(0, visibleCount)
    : results.list.slice(0, 4);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      {/* Header */}
      <section className="pt-12 sm:pt-16 pb-10 animate-fade-up">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          Step 3 of 3 · Your matches
        </p>
        <h1 className="mt-3 text-3xl sm:text-[40px] leading-tight font-display font-extrabold text-ink">
          Tailored for <span style={{ color: pMeta.tint }}>{pMeta.label}</span>
        </h1>
        <p className="mt-3 text-stone-400 text-lg leading-relaxed max-w-2xl">
          {results.list.length} client-catalog phone{results.list.length === 1 ? '' : 's'} in the
          {` ${bMeta.label.toLowerCase()} band (${bMeta.range})`}. Your top matches are ranked by
          the selected priority.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          INR prices use client USD values converted at ₹{DATASET_META.usdToInrRate.toFixed(2)} per USD ({DATASET_META.conversionDate}).
        </p>

        {/* Choice chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-full" style={{ background: pMeta.tint }}>
            <i className={pMeta.icon} />
            {pMeta.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-300 bg-white/[0.06] px-3 py-1.5 rounded-full">
            <i className="fa-solid fa-indian-rupee-sign text-[10px] text-sage" />
            {bMeta.label} · {bMeta.range}
          </span>
          {sizeLabel && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-300 bg-white/[0.06] px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-expand text-[10px] text-terra" />
              {sizeLabel}
            </span>
          )}
          <button
            id="refine-preferences"
            onClick={onRefine}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-full transition-colors"
          >
            <i className="fa-solid fa-sliders text-[10px]" />
            Refine
          </button>
        </div>

        {/* Relaxed filters note */}
        {results.relaxed.length > 0 && (
          <p className="mt-4 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3.5 py-2.5 inline-block">
            <i className="fa-solid fa-circle-info mr-1.5 text-amber-300" />
            We widened the search to show enough matches — your{' '}
            {results.relaxed.join(' and ')} preference{results.relaxed.length > 1 ? 's were' : ' was'}{' '}
            relaxed.
          </p>
        )}

      </section>

      {/* Top picks plus a searchable explorer for the full matching client catalog */}
      {results.list.length === 0 ? (
        <section className="text-center py-20 bg-panel rounded-3xl border border-stone-700 animate-fade-up">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-plum/10">
            <i className="fa-solid fa-magnifying-glass text-2xl text-plum" />
          </div>
          <h2 className="mt-4 text-lg font-display font-semibold text-ink">No phones match those filters</h2>
          <p className="mt-2 text-sm text-stone-400">Try loosening a preference or choosing another budget range.</p>
          <button onClick={onRefine} className="mt-6 px-6 py-3 rounded-full text-sm font-semibold btn-primary">
            Adjust preferences
          </button>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="text-sm text-stone-400">
              {browseAll
                ? `${exploredResults.length} matching model${exploredResults.length === 1 ? '' : 's'}`
                : `Top ${Math.min(4, results.list.length)} recommendations`}
            </p>
            <button
              id="toggle-catalog-browser"
              onClick={() => {
                setBrowseAll((open) => !open);
                setVisibleCount(12);
              }}
              className="px-4 py-2 rounded-full border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/10 transition-colors"
            >
              {browseAll ? 'Show top picks' : `Browse all ${results.list.length} matches`}
            </button>
          </div>

          {browseAll && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl border border-stone-700 bg-panel">
              <label className="sm:col-span-1">
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">Search model or brand</span>
                <input
                  id="catalog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="e.g. Voltix"
                  className="w-full rounded-xl border border-stone-700 bg-black/30 px-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-accent focus:outline-none"
                />
              </label>
              <label>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">Brand</span>
                <select
                  id="catalog-brand"
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-black/30 px-3 py-2.5 text-sm text-stone-100 focus:border-accent focus:outline-none"
                >
                  <option value="any">All brands</option>
                  {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </label>
              <label>
                <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">Sort by</span>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-black/30 px-3 py-2.5 text-sm text-stone-100 focus:border-accent focus:outline-none"
                >
                  <option value="match">Best match</option>
                  <option value="price">Lowest price</option>
                  <option value="rating">Highest customer rating</option>
                  <option value="battery">Largest battery</option>
                </select>
              </label>
            </div>
          )}

          {visibleResults.length === 0 ? (
            <p className="rounded-2xl border border-stone-700 bg-panel p-8 text-center text-stone-400">
              No models match that search. Clear the search or choose another brand.
            </p>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 animate-fade-up">
              {visibleResults.map((entry) => (
                <ResultCard key={entry.phone.id} entry={entry} purpose={purpose} />
              ))}
            </section>
          )}

          {browseAll && visibleResults.length < exploredResults.length && (
            <div className="mt-7 text-center">
              <button
                id="load-more-models"
                onClick={() => setVisibleCount((count) => count + 12)}
                className="px-5 py-2.5 rounded-full border border-stone-600 text-stone-200 text-sm font-semibold hover:border-accent hover:text-accent transition-colors"
              >
                Load 12 more · {exploredResults.length - visibleResults.length} remaining
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom actions */}
      <section className="mt-14 text-center animate-fade-up">
        <p className="text-sm text-stone-500">Not quite right?</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            id="restart-flow"
            onClick={onRestart}
            className="px-6 py-3 rounded-full border border-stone-600 text-stone-300 text-sm font-semibold hover:border-stone-500 hover:bg-white/[0.06] transition-all"
          >
            <i className="fa-solid fa-rotate-left mr-2 text-xs" />
            Start over with a new purpose
          </button>
          <button
            id="refine-bottom"
            onClick={onRefine}
            className="px-6 py-3 rounded-full text-sm font-semibold btn-primary"
          >
            <i className="fa-solid fa-sliders mr-2 text-xs" />
            Adjust budget &amp; filters
          </button>
        </div>
      </section>
    </main>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP — stage controller
// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
  // 'landing' → stage 1 · results shown only after the stage-2 modal submits
  const [stage, setStage] = useState('landing');
  const [modalOpen, setModalOpen] = useState(false);
  const [purpose, setPurpose] = useState(null);
  const [prefs, setPrefs] = useState({ budget: null, size: 'any' });

  // Scroll to top whenever the visible stage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, modalOpen]);

  // ── Stage 1 → open the stage-2 modal with the chosen purpose ─────────────
  const handleSelectPurpose = useCallback((key) => {
    setPurpose(key);
    setModalOpen(true);
  }, []);

  // ── Stage 2 → commit preferences and reveal stage-3 results ─────────────
  const handleSubmitPrefs = useCallback(() => {
    if (!prefs.budget) return;
    setModalOpen(false);
    setStage('results');
  }, [prefs.budget]);

  const handleRestart = useCallback(() => {
    setPurpose(null);
    setPrefs({ budget: null, size: 'any' });
    setModalOpen(false);
    setStage('landing');
  }, []);

  const handleHome = useCallback(() => {
    if (stage === 'results') {
      // Logo click from results just returns to the landing stage
      setStage('landing');
      setModalOpen(false);
    }
  }, [stage]);

  const handleRefine = useCallback(() => setModalOpen(true), []);
  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  // ── Recommendation engine (memoised) ────────────────────────────────────
  const results = useMemo(() => {
    if (stage !== 'results' || !purpose || !prefs.budget) {
      return { list: [], relaxed: [] };
    }
    return getRecommendations({
      purpose,
      budget: prefs.budget,
      size: prefs.size,
      limit: Infinity,
    });
  }, [stage, purpose, prefs]);

  const progressStep = modalOpen ? 1 : stage === 'results' ? 2 : 0;

  return (
    <div className="min-h-screen text-stone-100 font-sans">
      <TopBar
        step={progressStep}
        onHome={stage === 'results' ? handleRestart : handleHome}
        showHome={stage === 'results'}
      />

      {stage === 'landing' && <LandingStage onSelectPurpose={handleSelectPurpose} />}

      {stage === 'results' && purpose && prefs.budget && (
        <ResultsStage
          purpose={purpose}
          prefs={prefs}
          results={results}
          onRefine={handleRefine}
          onRestart={handleRestart}
        />
      )}

      {modalOpen && purpose && (
        <PreferencesModal
          purpose={purpose}
          prefs={prefs}
          onPrefsChange={setPrefs}
          onSubmit={handleSubmitPrefs}
          onClose={handleCloseModal}
          isRefine={stage === 'results'}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-700/80 py-8">
        <p className="text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="fa-solid fa-circle text-[5px] text-plum" />
            <i className="fa-solid fa-circle text-[5px] text-terra" />
            <i className="fa-solid fa-circle text-[5px] text-sage" />
            <i className="fa-solid fa-circle text-[5px] text-accent" />
          </span>
          PhoneFit · {phones.length} client-provided devices · Built with React + Tailwind
        </p>
      </footer>
    </div>
  );
};

export default App;
