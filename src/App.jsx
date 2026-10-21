// =============================================================================
//  src/App.js — PhoneFit: a 3-stage mobile recommendation experience
//
//  STAGE 1 · Landing page    — headline + purpose prompt
//      "What is the primary purpose or main feature you need in your mobile
//       phone?" → Gaming / Photography-Videography / Daily Work & Battery /
//       Media / General Everyday Use
//
//  STAGE 2 · Inner modal     — budget & optional preferences
//      Price range (Entry / Mid-range / Flagship) + quick toggles for
//      OS (iOS vs Android) and screen size.
//
//  STAGE 3 · Results section — 3–4 minimalist recommendation cards
//      Name + image placeholder, price, purpose-tailored highlights,
//      and concise pros & cons.
//
//  React 16 · useState/useMemo/useEffect · no router · Tailwind CDN styling
//  (light minimalist theme defined in public/index.html)
// =============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  phones,
  PURPOSES,
  BUDGET_TIERS,
  OS_OPTIONS,
  SIZE_OPTIONS,
  purposeMeta,
  budgetMeta,
  getRecommendations,
  brandTones,
} from './data/mockDatabase';

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** ₹79,900 — Indian digit grouping */
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
              className={cx('h-px w-4 sm:w-8', state === 'todo' ? 'bg-stone-300' : 'bg-accent')}
            />
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cx(
                'w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors',
                state === 'todo' && 'bg-stone-200 text-stone-500',
                state === 'active' && 'bg-accent text-white shadow-sm',
                state === 'done' && 'bg-accent/15 text-accent'
              )}
            >
              {state === 'done' ? <i className="fa-solid fa-check text-[9px]" /> : i + 1}
            </span>
            <span
              className={cx(
                'text-xs font-medium tracking-wide hidden sm:block',
                state === 'todo' ? 'text-stone-400' : 'text-stone-700'
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
  <header className="sticky top-0 z-40 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-stone-200/80">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
      <button onClick={onHome} className="flex items-center gap-2.5 group" id="logo-home">
        <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
          <i className="fa-solid fa-mobile-screen-button text-sm" />
        </div>
        <span className="font-semibold text-[17px] tracking-tight text-stone-900">
          Phone<span className="text-accent">Fit</span>
        </span>
      </button>

      <ProgressSteps current={step} />

      {showHome ? (
        <button
          onClick={onHome}
          className="text-sm font-medium text-stone-500 hover:text-accent transition-colors"
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
      style={{ background: 'linear-gradient(165deg, ' + tone + '12 0%, ' + tone + '26 100%)' }}
    >
      {/* Match badge */}
      {match !== undefined && (
        <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/85 text-stone-700 shadow-sm">
          {Math.round(match)}% match
        </span>
      )}

      <svg width="86" height="150" viewBox="0 0 86 150" role="img" aria-label={phone.name + ' placeholder image'}>
        {/* Device body */}
        <rect x="10" y="4" width="66" height="142" rx="13" fill="#FFFFFF" stroke={tone} strokeWidth="2.4" />
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
    className="group text-left bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-accent/40 transition-all duration-200 flex flex-col gap-4"
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
      style={{ background: purpose.tint + '18', color: purpose.tint }}
    >
      <i className={purpose.icon} />
    </div>
    <div>
      <h3 className="font-semibold text-stone-900 text-[15px] leading-snug">{purpose.label}</h3>
      <p className="text-stone-500 text-[13px] mt-1 leading-relaxed">{purpose.description}</p>
    </div>
    <div className="flex items-center gap-1.5 text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
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
      <h1 className="mt-6 text-4xl sm:text-[52px] leading-[1.08] font-semibold tracking-tight text-stone-900">
        Find the phone
        <br />
        that fits your life.
      </h1>
      <p className="mt-5 text-lg text-stone-500 leading-relaxed max-w-xl mx-auto">
        Skip the endless spec sheets. Answer two quick questions and get a
        shortlist of 3–4 phones tailored to what you actually care about.
      </p>
    </section>

    {/* Interactive purpose prompt */}
    <section className="pb-24 animate-fade-up">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-stone-400">Step 1 · Your priority</p>
        <h2 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900 leading-snug">
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
    <p className="text-xs font-medium text-stone-500 mb-2">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cx(
            'px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-150',
            value === opt.key
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
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
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Budget and preferences"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-modal-in max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-stone-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-accent">
                Step 2 of 3 · Budget &amp; preferences
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                What's your budget?
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          {/* Chosen purpose recap */}
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-full px-3 py-1.5">
            <i className={pMeta.icon} style={{ color: pMeta.tint }} />
            For: {pMeta.label}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-7">
          {/* Budget tiers */}
          <div className="space-y-2.5">
            {BUDGET_TIERS.map((tier) => {
              const active = prefs.budget === tier.key;
              return (
                <button
                  key={tier.key}
                  id={'budget-' + tier.key}
                  onClick={() => onPrefsChange({ ...prefs, budget: tier.key })}
                  className={cx(
                    'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all duration-150',
                    active
                      ? 'border-accent bg-accent/[0.07] shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  )}
                >
                  <span
                    className={cx(
                      'w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      active ? 'border-accent bg-accent text-white' : 'border-stone-300 text-transparent'
                    )}
                  >
                    <i className="fa-solid fa-check text-xs" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-[15px]">{tier.label}</span>
                      <span className="text-xs font-medium text-accent">{tier.range}</span>
                    </span>
                    <span className="block text-xs text-stone-500 mt-0.5">{tier.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Optional preferences */}
          <div className="pt-5 border-t border-stone-100 space-y-5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-stone-400">
                Optional filters
              </p>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <Segmented
              label="Operating system"
              options={OS_OPTIONS}
              value={prefs.os}
              onChange={(v) => onPrefsChange({ ...prefs, os: v })}
            />
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
            className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
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
                ? 'bg-accent text-white hover:bg-accent-dark shadow-sm hover:shadow-md'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
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

const ResultCard = ({ entry, purpose }) => {
  const phone = entry.phone;
  const pMeta = purposeMeta(purpose);
  const notes = phone.purposeNotes[purpose] || [];
  const tierLabel = budgetMeta(
    phone.priceINR < 20000 ? 'entry' : phone.priceINR <= 50000 ? 'mid' : 'flagship'
  ).label;

  return (
    <article className="bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-5">
      <PhoneVisual phone={phone} match={entry.match} tint={pMeta.tint} />

      {/* Name + price */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-stone-900 text-lg leading-snug">{phone.name}</h3>
          <span className="text-[11px] font-medium text-stone-500 bg-stone-100 rounded-full px-2.5 py-1 whitespace-nowrap">
            {phone.os}
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          {phone.brand} · {phone.year} · {phone.chipset}
        </p>
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-xl font-semibold tracking-tight text-stone-900">
            {inrFormat(phone.priceINR)}
          </span>
          <span className="text-xs text-stone-400">{tierLabel}</span>
        </div>
      </div>

      {/* Purpose-tailored highlights */}
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-stone-400 mb-2.5">
          Why it fits {pMeta.label.split('/')[0]}
        </p>
        <ul className="space-y-1.5">
          {notes.map((n) => (
            <li key={n} className="flex items-start gap-2 text-[13px] text-stone-700 leading-relaxed">
              <i className="fa-solid fa-circle text-[5px] mt-1.5" style={{ color: pMeta.tint }} />
              {n}
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[11px] text-stone-400">
          {phone.specs.batteryPower} mAh · {phone.specs.ramGB} GB RAM · {phone.screenInches}"{' '}
          {phone.displayType}
        </p>
      </div>

      {/* Pros & cons */}
      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-stone-100 mt-auto">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-emerald-700/80 mb-2">Pros</p>
          <ul className="space-y-1.5">
            {phone.pros.map((pro) => (
              <li key={pro} className="flex items-start gap-2 text-[13px] text-stone-700 leading-relaxed">
                <i className="fa-solid fa-check text-emerald-600 text-[10px] mt-1" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-rose-700/70 mb-2">Cons</p>
          <ul className="space-y-1.5">
            {phone.cons.map((con) => (
              <li key={con} className="flex items-start gap-2 text-[13px] text-stone-500 leading-relaxed">
                <i className="fa-solid fa-minus text-rose-400 text-[10px] mt-1" />
                {con}
              </li>
            ))}
          </ul>
        </div>
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
  const osLabel = prefs.os === 'any' ? null : prefs.os;
  const sizeLabel = prefs.size === 'any'
    ? null
    : prefs.size === 'compact'
      ? 'Compact screen'
      : 'Large screen';

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      {/* Header */}
      <section className="pt-12 sm:pt-16 pb-10 animate-fade-up">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          Step 3 of 3 · Your matches
        </p>
        <h1 className="mt-3 text-3xl sm:text-[40px] leading-tight font-semibold tracking-tight text-stone-900">
          Tailored for <span style={{ color: pMeta.tint }}>{pMeta.label}</span>
        </h1>
        <p className="mt-3 text-stone-500 text-lg leading-relaxed max-w-2xl">
          {results.list.length} hand-picked phone{results.list.length === 1 ? '' : 's'} priced in
          the {bMeta.label.toLowerCase()} band ({bMeta.range}), ranked by how well they match your
          priority.
        </p>

        {/* Choice chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-full" style={{ background: pMeta.tint }}>
            <i className={pMeta.icon} />
            {pMeta.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
            <i className="fa-solid fa-indian-rupee-sign text-[10px]" />
            {bMeta.label} · {bMeta.range}
          </span>
          {osLabel && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-laptop text-[10px]" />
              {osLabel}
            </span>
          )}
          {sizeLabel && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-expand text-[10px]" />
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
          <p className="mt-4 text-xs text-stone-500 bg-amber-50 border border-amber-200/70 rounded-xl px-3.5 py-2.5 inline-block">
            <i className="fa-solid fa-circle-info mr-1.5 text-amber-500" />
            We widened the search to show enough matches — your{' '}
            {results.relaxed.join(' and ')} preference{results.relaxed.length > 1 ? 's were' : ' was'}{' '}
            relaxed.
          </p>
        )}

        {/* Honest shortlist note (e.g. a single iPhone in a budget band) */}
        {results.list.length > 0 && results.list.length < 3 && prefs.os !== 'any' && results.relaxed.length === 0 && (
          <p className="mt-4 text-xs text-stone-500 bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 inline-block">
            <i className="fa-solid fa-circle-info mr-1.5 text-accent" />
            Only {results.list.length} {prefs.os} phone{results.list.length === 1 ? '' : 's'} fit
            {results.list.length === 1 ? 's' : ''} this budget — showing the honest shortlist rather
            than swapping your OS preference.
          </p>
        )}
      </section>

      {/* Recommendation cards */}
      {results.list.length === 0 ? (
        <section className="text-center py-20 bg-white rounded-3xl border border-stone-200 animate-fade-up">
          <i className="fa-solid fa-magnifying-glass text-3xl text-stone-300" />
          <h2 className="mt-4 text-lg font-semibold text-stone-800">No phones match those filters</h2>
          <p className="mt-2 text-sm text-stone-500">Try loosening a preference or choosing another budget range.</p>
          <button
            onClick={onRefine}
            className="mt-6 px-6 py-3 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-dark transition-colors"
          >
            Adjust preferences
          </button>
        </section>
      ) : (
        <section
          key={purpose + prefs.budget + prefs.os + prefs.size}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 animate-fade-up"
        >
          {results.list.map((entry) => (
            <ResultCard key={entry.phone.id} entry={entry} purpose={purpose} />
          ))}
        </section>
      )}

      {/* Bottom actions */}
      <section className="mt-14 text-center animate-fade-up">
        <p className="text-sm text-stone-400">Not quite right?</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            id="restart-flow"
            onClick={onRestart}
            className="px-6 py-3 rounded-full border border-stone-300 text-stone-700 text-sm font-semibold hover:border-stone-400 hover:bg-white transition-all"
          >
            <i className="fa-solid fa-rotate-left mr-2 text-xs" />
            Start over with a new purpose
          </button>
          <button
            id="refine-bottom"
            onClick={onRefine}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-dark shadow-sm hover:shadow-md transition-all"
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
  const [prefs, setPrefs] = useState({ budget: null, os: 'any', size: 'any' });

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
    setPrefs({ budget: null, os: 'any', size: 'any' });
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
      os: prefs.os,
      size: prefs.size,
    });
  }, [stage, purpose, prefs]);

  const progressStep = modalOpen ? 1 : stage === 'results' ? 2 : 0;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans">
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
      <footer className="border-t border-stone-200/80 py-8">
        <p className="text-center text-xs text-stone-400">
          PhoneFit · Curated demo dataset of {phones.length} devices · Built with React + Tailwind
        </p>
      </footer>
    </div>
  );
};

export default App;
