// =============================================================================
//  src/App.jsx — PhoneFit: an interactive 3-stage mobile recommendation app
//
//  STAGE 1 · Landing   — animated hero + 3D-tilt purpose cards
//  STAGE 2 · Modal     — budget cards (with catalog share bars) + screen-size picker
//  (transition)        — short "finding your matches" loading animation
//  STAGE 3 · Results   — animated stats, ranked cards with fit rings and spec
//                        meters, catalog explorer, and side-by-side comparison
//
//  Only fields present in the client CSV are shown. OS / refresh-rate /
//  benchmark data is intentionally absent because the dataset doesn't have it.
// =============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './phonefit-ui.css';
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
  tierOf,
  brandTones,
} from './data/mockDatabase';

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12; // cards revealed per "Load more"
const RESULTS_DELAY_MS = 1200; // length of the loading animation
const MAX_COMPARE = 3;

const inrFormat = (n) => '₹' + n.toLocaleString('en-IN');
const formatStorage = (gb) => (gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);
const pct = (value, max) => Math.max(0, Math.min((Number(value) / max) * 100, 100)) || 0;

const cx = (...parts) => parts.filter(Boolean).join(' ');

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mouse-follow spotlight + gentle 3D tilt. Sets CSS variables (no re-renders). */
const spotlightProps = (maxTilt = 6) => ({
  onMouseMove: (e) => {
    if (prefersReducedMotion()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', x + 'px');
    el.style.setProperty('--my', y + 'px');
    el.style.setProperty('--rx', ((0.5 - y / r.height) * maxTilt).toFixed(2) + 'deg');
    el.style.setProperty('--ry', ((x / r.width - 0.5) * maxTilt).toFixed(2) + 'deg');
  },
  onMouseLeave: (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  },
});

/** Animated number that eases up to `target`. */
const useCountUp = (target, duration = 1000) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      setValue(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
};

// ─────────────────────────────────────────────────────────────────────────────
//  PROGRESS TRACKER + TOP BAR
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
              className={cx(
                'h-px w-4 sm:w-8 transition-colors duration-500',
                state === 'todo' ? 'bg-stone-600' : 'bg-accent'
              )}
            />
          )}
          <div className="flex items-center gap-1.5" aria-current={state === 'active' ? 'step' : undefined}>
            <span
              className={cx(
                'w-6 h-6 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center transition-all duration-300',
                state === 'todo' && 'bg-white/10 text-stone-400',
                state === 'active' && 'bg-accent text-white shadow-glow scale-110',
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

const TopBar = ({ step, onHome, showHome }) => (
  <header className="sticky top-0 z-40 bg-[#0B0C10]/80 backdrop-blur-xl border-b border-stone-700/80">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
      <button onClick={onHome} className="flex items-center gap-2.5 group" id="logo-home">
        <div
          className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-tile group-hover:scale-110 group-hover:rotate-6 transition-transform"
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
//  SHARED VISUALS
// ─────────────────────────────────────────────────────────────────────────────

/** Circular fit score that animates around the ring. */
const MatchRing = ({ value, size = 56, stroke = 5 }) => {
  const score = Math.max(0, Math.min(Math.round(value) || 0, 100));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = score >= 85 ? '#8FC1A4' : score >= 70 ? '#FBBF24' : '#FB7185';
  return (
    <div
      className="relative rounded-full bg-black/60 backdrop-blur-sm"
      style={{ width: size, height: size }}
      title="Fit score: a rule-based match to your priority, not a benchmark"
    >
      <svg width={size} height={size} role="img" aria-label={`Fit score ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          className="pf-ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ '--c': c, '--o': offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-mono font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] uppercase tracking-wider text-stone-400 mt-0.5">fit</span>
      </div>
    </div>
  );
};

const Stars = ({ rating }) => {
  const rounded = Math.round((Number(rating) || 0) * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={
            rounded >= n
              ? 'fa-solid fa-star'
              : rounded >= n - 0.5
                ? 'fa-solid fa-star-half-stroke'
                : 'fa-regular fa-star text-stone-600'
          }
        />
      ))}
    </span>
  );
};

const SpecMeter = ({ icon, label, value, percent, tint, delay = 0, dim = false }) => (
  <div className={cx('transition-opacity duration-300', dim && 'opacity-50')}>
    <div className="flex items-center justify-between text-[11px] text-stone-400">
      <span className="flex items-center gap-1.5">
        <i className={icon} style={{ color: tint }} />
        {label}
      </span>
      <span className="font-mono text-stone-200">{value}</span>
    </div>
    <div className="pf-meter mt-1">
      <span style={{ '--w': percent + '%', background: tint, animationDelay: delay + 'ms' }} />
    </div>
  </div>
);

/** SVG device illustration (no product photos in the dataset). */
const PhoneVisual = ({ phone, match, tint, badge }) => {
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
      {badge && (
        <span
          className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #54649F, #6B5B8A)' }}
        >
          {badge}
        </span>
      )}
      {match !== undefined && (
        <div className="absolute top-3 right-3">
          <MatchRing value={match} />
        </div>
      )}

      <svg
        className="pf-phone-svg"
        width="86"
        height="150"
        viewBox="0 0 86 150"
        role="img"
        aria-label={phone.name + ' illustration'}
      >
        <rect x="10" y="4" width="66" height="142" rx="13" fill="#121218" stroke={tone} strokeWidth="2.4" />
        <rect x="16" y="12" width="54" height="126" rx="8" fill={tone} opacity="0.12" />
        <rect x="35" y="18" width="16" height="4.5" rx="2.25" fill={tone} opacity="0.55" />
        <rect x="22" y="28" width="22" height="22" rx="6" fill={tone} opacity="0.22" />
        <circle cx="29" cy="35" r="3.4" fill={tone} />
        <circle cx="38" cy="35" r="3.4" fill={tone} />
        <circle cx="29" cy="44" r="3.4" fill={tone} opacity="0.55" />
        <text x="43" y="95" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="700" fill={tone} opacity="0.8">
          {(phone.brand || '?').charAt(0)}
        </text>
        <rect x="32" y="128" width="22" height="3" rx="1.5" fill={tone} opacity="0.35" />
      </svg>

      {tint && <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: tint }} aria-hidden="true" />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 1 · LANDING
// ─────────────────────────────────────────────────────────────────────────────

const HeroPhone = ({ tint, className = '', style }) => (
  <div
    className={cx('absolute rounded-[26px] border-2 bg-[#121218] shadow-2xl pf-float', className)}
    style={{ borderColor: tint, boxShadow: `0 25px 60px -20px ${tint}88`, ...style }}
    aria-hidden="true"
  >
    <div className="absolute inset-2 rounded-[18px] overflow-hidden" style={{ background: tint + '1F' }}>
      <div className="mx-auto mt-2 h-1.5 w-8 rounded-full" style={{ background: tint + '88' }} />
      <div className="m-3 h-16 rounded-xl" style={{ background: tint + '33' }} />
      <div className="mx-3 h-2 rounded-full" style={{ background: tint + '55' }} />
      <div className="mx-3 mt-2 h-2 w-2/3 rounded-full" style={{ background: tint + '33' }} />
      <div className="mx-3 mt-4 grid grid-cols-2 gap-2">
        <div className="h-10 rounded-lg" style={{ background: tint + '26' }} />
        <div className="h-10 rounded-lg" style={{ background: tint + '26' }} />
      </div>
    </div>
  </div>
);

const FloatChip = ({ icon, text, tint, className, delay }) => (
  <span
    className={cx(
      'absolute pf-float inline-flex items-center gap-2 text-xs font-semibold text-stone-100 rounded-full px-3.5 py-2 bg-black/60 backdrop-blur-md border border-white/10 shadow-xl',
      className
    )}
    style={{ '--d': delay }}
    aria-hidden="true"
  >
    <i className={icon} style={{ color: tint }} />
    {text}
  </span>
);

const HeroStat = ({ value, label, suffix = '' }) => {
  const n = useCountUp(value);
  return (
    <div>
      <div className="text-3xl font-display font-extrabold text-ink tabular-nums">
        {n}
        {suffix}
      </div>
      <div className="text-xs uppercase tracking-[0.16em] text-stone-500 mt-0.5">{label}</div>
    </div>
  );
};

const PurposeCard = ({ purpose, index, onSelect }) => (
  <button
    id={'purpose-' + purpose.key}
    onClick={() => onSelect(purpose.key)}
    style={{ '--tint': purpose.tint, '--i': index }}
    {...spotlightProps(7)}
    className="pf-card pf-rise overflow-hidden group text-left bg-panel rounded-2xl border border-stone-700 p-6 shadow-sm flex flex-col gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  >
    <span
      className="absolute -top-2 right-3 text-7xl font-display font-black select-none"
      style={{ color: purpose.tint + '14' }}
      aria-hidden="true"
    >
      {String(index + 1).padStart(2, '0')}
    </span>
    <div
      className="pf-icon w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative"
      style={{
        background: purpose.tint + '1C',
        color: purpose.tint,
        boxShadow: 'inset 0 0 0 1px ' + purpose.tint + '33, 0 8px 24px -10px ' + purpose.tint,
      }}
    >
      <i className={purpose.icon} />
    </div>
    <div className="relative">
      <h3 className="font-display font-semibold text-ink text-[17px] leading-snug">{purpose.label}</h3>
      <p className="text-stone-400 text-[13px] mt-1.5 leading-relaxed">{purpose.description}</p>
    </div>
    <div className="relative mt-auto flex items-center gap-2 text-xs font-semibold" style={{ color: purpose.tint }}>
      Choose this
      <i className="pf-arrow fa-solid fa-arrow-right text-[10px]" />
    </div>
  </button>
);

const LandingStage = ({ onSelectPurpose }) => {
  const scrollToPurposes = () => {
    const el = document.getElementById('purposes');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="relative max-w-6xl mx-auto px-5 sm:px-8 overflow-x-clip">
      {/* ambient glow */}
      <div className="pf-orb w-[420px] h-[420px] -top-24 -left-24" style={{ background: '#54649F' }} aria-hidden="true" />
      <div className="pf-orb w-[360px] h-[360px] top-40 right-0" style={{ background: '#6B5B8A', animationDelay: '-6s' }} aria-hidden="true" />
      <div className="pf-orb w-[300px] h-[300px] top-[520px] left-1/3" style={{ background: '#4A6785', animationDelay: '-11s' }} aria-hidden="true" />

      {/* Hero */}
      <section className="relative grid lg:grid-cols-2 gap-10 items-center pt-14 sm:pt-20 pb-16">
        <div className="pf-rise text-center lg:text-left">
          <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase text-accent bg-accent/10 px-3.5 py-1.5 rounded-full">
            <i className="fa-solid fa-compass text-[10px]" />
            Smart phone finder
          </span>
          <h1 className="mt-6 text-5xl sm:text-[64px] leading-[1.03] font-display font-black text-ink">
            Find the phone
            <br />
            that <span className="text-gradient">fits your life.</span>
          </h1>
          <p className="mt-5 text-lg text-stone-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Pick a priority and a budget. Get a ranked shortlist in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              id="hero-start"
              onClick={scrollToPurposes}
              className="pf-shine btn-primary px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-transform"
            >
              Find my phone
              <i className="fa-solid fa-arrow-down ml-2 text-xs" />
            </button>
            <span className="text-xs text-stone-500">No sign-up · takes about 20 seconds</span>
          </div>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-9">
            <HeroStat value={phones.length} label="Phones" />
            <div className="w-px h-9 bg-stone-700" />
            <HeroStat value={PURPOSES.length} label="Priorities" />
            <div className="w-px h-9 bg-stone-700" />
            <HeroStat value={BUDGET_TIERS.length} label="Budgets" />
          </div>
        </div>

        {/* Floating phone cluster */}
        <div className="relative h-[380px] sm:h-[440px] hidden sm:block" aria-hidden="true">
          <HeroPhone tint="#9C8BD8" className="w-[150px] h-[290px] left-[8%] top-[60px]" style={{ '--r': '-8deg', '--d': '0s' }} />
          <HeroPhone tint="#7FA8D9" className="w-[170px] h-[330px] left-[34%] top-[16px] z-10" style={{ '--r': '3deg', '--d': '-1.5s' }} />
          <HeroPhone tint="#D0967B" className="w-[150px] h-[290px] right-[4%] top-[80px]" style={{ '--r': '9deg', '--d': '-3s' }} />
          <FloatChip icon="fa-solid fa-battery-three-quarters" text="5,000 mAh" tint="#8FC1A4" className="left-0 top-4" delay="-2s" />
          <FloatChip icon="fa-solid fa-camera-retro" text="200 MP" tint="#D0967B" className="right-0 top-[60px]" delay="-0.8s" />
          <FloatChip icon="fa-solid fa-film" text="AMOLED" tint="#7FA8D9" className="left-[6%] bottom-10" delay="-3.4s" />
          <FloatChip icon="fa-solid fa-gamepad" text="12 GB RAM" tint="#9C8BD8" className="right-[6%] bottom-4" delay="-1.6s" />
        </div>
      </section>

      {/* Purpose picker */}
      <section id="purposes" className="relative pb-24 pt-6 scroll-mt-24">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">Step 1 · Your priority</p>
          <h2 className="mt-3 text-2xl sm:text-[32px] font-display font-semibold text-ink leading-snug">
            What matters most in your next phone?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PURPOSES.map((p, i) => (
            <PurposeCard key={p.key} purpose={p} index={i} onSelect={onSelectPurpose} />
          ))}
        </div>
      </section>
    </main>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 2 · PREFERENCES MODAL
// ─────────────────────────────────────────────────────────────────────────────

const SIZE_ICON_HEIGHT = { compact: 22, standard: 28, large: 34 };

const SizeCard = ({ option, active, onSelect }) => (
  <button
    onClick={() => onSelect(option.key)}
    aria-pressed={active}
    className={cx(
      'flex-1 min-w-[96px] flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5',
      active
        ? 'border-accent bg-accent/10 shadow-glow'
        : 'border-stone-700 bg-white/[0.03] hover:border-stone-500'
    )}
  >
    <span className="h-9 flex items-end justify-center">
      {option.key === 'any' ? (
        <i className={cx('fa-solid fa-table-cells-large text-xl', active ? 'text-accent' : 'text-stone-500')} />
      ) : (
        <span
          className={cx('block w-4 rounded-[5px] border-2 transition-colors', active ? 'border-accent' : 'border-stone-500')}
          style={{ height: SIZE_ICON_HEIGHT[option.key] }}
        />
      )}
    </span>
    <span className={cx('text-xs font-medium text-center', active ? 'text-ink' : 'text-stone-300')}>{option.label}</span>
  </button>
);

const PreferencesModal = ({ purpose, initialPrefs, onSubmit, onClose, isRefine }) => {
  // Edit a local draft so Cancel / Esc / backdrop never change committed preferences.
  const [draft, setDraft] = useState(initialPrefs);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const pMeta = purposeMeta(purpose);
  const canSubmit = Boolean(draft.budget);
  const tierCounts = useMemo(
    () => BUDGET_TIERS.map((tier) => ({ tier, count: phones.filter((phone) => tier.matches(phone)).length })),
    []
  );
  const biggest = Math.max(1, ...tierCounts.map((t) => t.count));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Budget and preferences"
        className="relative w-full max-w-lg bg-panel rounded-3xl shadow-2xl animate-modal-in max-h-[92vh] overflow-y-auto"
      >
        <div
          className="px-7 pt-7 pb-5 border-b border-stone-800"
          style={{ background: 'linear-gradient(135deg, ' + pMeta.tint + '18 0%, transparent 62%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: pMeta.tint }}>
                Step 2 of 3 · Budget
              </p>
              <h2 className="mt-2 text-2xl font-display font-semibold text-ink">What's your budget?</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/[0.06] text-stone-400 hover:bg-white/10 hover:rotate-90 transition-all flex items-center justify-center flex-shrink-0"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          <div
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1.5"
            style={{ background: pMeta.tint + '1F', color: pMeta.tint }}
          >
            <i className={pMeta.icon} />
            {pMeta.label}
          </div>
        </div>

        <div className="px-7 py-6 space-y-7">
          <div className="space-y-2.5">
            {tierCounts.map(({ tier, count }, i) => {
              const active = draft.budget === tier.key;
              return (
                <button
                  key={tier.key}
                  id={'budget-' + tier.key}
                  onClick={() => setDraft({ ...draft, budget: tier.key })}
                  aria-pressed={active}
                  style={{ '--i': i }}
                  className={cx(
                    'pf-rise w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5',
                    active
                      ? 'border-accent bg-accent/10 shadow-glow'
                      : 'border-stone-700 hover:border-stone-500 bg-white/[0.03]'
                  )}
                >
                  <span
                    className={cx(
                      'w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                      active
                        ? 'border-transparent text-white shadow-glow bg-gradient-to-br from-accent via-[#54649F] to-plum scale-110'
                        : 'border-stone-600 text-transparent'
                    )}
                  >
                    <i className="fa-solid fa-check text-xs" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display font-semibold text-ink text-[15px]">{tier.label}</span>
                      <span className="text-xs font-mono font-semibold text-accent">{tier.range}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="pf-meter flex-1">
                        <span style={{ '--w': (count / biggest) * 100 + '%', background: pMeta.tint, animationDelay: 150 + i * 120 + 'ms' }} />
                      </span>
                      <span className="text-[11px] font-mono text-stone-400 w-[68px] text-right">{count} models</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="-mt-4 text-[11px] leading-relaxed text-stone-500">
            Prices are estimates: client USD × ₹{DATASET_META.usdToInrRate.toFixed(2)} ({DATASET_META.conversionDate}).
          </p>

          <div className="pt-5 border-t border-stone-800 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-stone-500">Screen size · optional</p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {SIZE_OPTIONS.map((option) => (
                <SizeCard
                  key={option.key}
                  option={option}
                  active={draft.size === option.key}
                  onSelect={(key) => setDraft({ ...draft, size: key })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-7 pb-7 pt-2 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm font-medium text-stone-400 hover:text-stone-200 transition-colors">
            <i className="fa-solid fa-arrow-left mr-1.5 text-xs" />
            {isRefine ? 'Cancel' : 'Back'}
          </button>
          <button
            id="submit-preferences"
            onClick={() => onSubmit(draft)}
            disabled={!canSubmit}
            className={cx(
              'px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200',
              canSubmit ? 'btn-primary hover:scale-105 active:scale-95' : 'bg-white/10 text-stone-500 cursor-not-allowed'
            )}
          >
            {isRefine ? 'Update my matches' : 'Show my matches'}
            <i className="fa-solid fa-arrow-right ml-2 text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOADING TRANSITION
// ─────────────────────────────────────────────────────────────────────────────

const LoadingStage = ({ purpose }) => {
  const pMeta = purposeMeta(purpose);
  const labels = [
    `Scanning ${phones.length} phones`,
    'Applying your budget',
    `Scoring for ${pMeta.label.split('/')[0].trim()}`,
    'Ranking your matches',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((n) => Math.min(n + 1, labels.length - 1)), RESULTS_DELAY_MS / labels.length);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 min-h-[70vh] flex flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <div className="relative w-24 h-24 flex items-center justify-center" style={{ '--tint': pMeta.tint }}>
        <span className="pf-pulse" style={{ '--d': '0s' }} />
        <span className="pf-pulse" style={{ '--d': '0.6s' }} />
        <span className="pf-pulse" style={{ '--d': '1.2s' }} />
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: pMeta.tint + '26', color: pMeta.tint, boxShadow: '0 0 40px -6px ' + pMeta.tint }}
        >
          <i className={pMeta.icon} />
        </div>
      </div>
      <p key={step} className="pf-swap mt-10 text-lg font-display font-semibold text-ink">
        {labels[step]}…
      </p>
      <div className="mt-5 w-56 pf-meter">
        <span className="pf-progress" style={{ background: pMeta.tint, '--dur': RESULTS_DELAY_MS + 'ms' }} />
      </div>
    </main>
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

// Which meters matter for each priority (others are dimmed)
const FOCUS = {
  gaming: ['RAM', 'Battery'],
  camera: ['Camera'],
  battery: ['Battery', 'RAM'],
  media: ['Storage'],
  everyday: ['RAM', 'Battery', 'Camera', 'Storage'],
};

const ResultCard = ({ entry, purpose, rank, badge, selected, canSelectMore, onToggleCompare }) => {
  const phone = entry.phone;
  const pMeta = purposeMeta(purpose);
  const notes = purposeNotesFor(phone)[purpose] || [];
  const tierKey = tierOf(phone);
  const tierLabel = budgetMeta(tierKey).label;
  const cameraLabel = phone.cameraMP > 0 ? `${phone.cameraMP} MP` : 'Not listed';
  const focus = FOCUS[purpose] || FOCUS.everyday;

  const meters = [
    { label: 'Battery', icon: 'fa-solid fa-battery-three-quarters', value: `${phone.batteryMah.toLocaleString()} mAh`, percent: pct(phone.batteryMah, 6000) },
    { label: 'RAM', icon: 'fa-solid fa-memory', value: `${phone.ramGB} GB`, percent: pct(phone.ramGB, 12) },
    { label: 'Camera', icon: 'fa-solid fa-camera', value: cameraLabel, percent: pct(phone.cameraMP, 200) },
    { label: 'Storage', icon: 'fa-solid fa-hard-drive', value: formatStorage(phone.storageGB), percent: pct(phone.storageGB, 512) },
  ];

  return (
    <article
      className="pf-card pf-rise bg-panel rounded-3xl border border-stone-700 shadow-sm p-5 flex flex-col gap-4"
      style={{
        '--tint': pMeta.tint,
        '--i': Math.min(rank, 11),
        ...(selected ? { boxShadow: `0 0 0 2px ${pMeta.tint}` } : null),
      }}
      {...spotlightProps(4)}
    >
      <PhoneVisual phone={phone} match={entry.match} tint={pMeta.tint} badge={badge} />

      <div>
        <h3 className="font-display font-semibold text-ink text-lg leading-snug">{phone.name}</h3>
        <p className="text-xs font-mono text-stone-500 mt-1">
          {phone.brand} · {phone.processor || 'Processor not listed'}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xl font-mono font-bold tracking-tight text-ink">{inrFormat(phone.priceINR)}</span>
          <span className={cx('text-[11px] font-semibold rounded-full px-2 py-0.5', TIER_CHIP[tierKey])}>{tierLabel}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Stars rating={phone.rating} />
          <span className="text-[11px] font-mono text-stone-400">{phone.rating}/5</span>
          <span className="text-[11px] text-stone-600">·</span>
          <span className="text-[11px] font-mono text-stone-400">{phone.weightGrams} g</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {meters.map((m, i) => (
          <SpecMeter
            key={m.label}
            icon={m.icon}
            label={m.label}
            value={m.value}
            percent={m.percent}
            tint={pMeta.tint}
            delay={150 + i * 90}
            dim={!focus.includes(m.label)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <span
            key={note}
            className="text-[11px] rounded-full px-2.5 py-1 border"
            style={{ color: pMeta.tint, borderColor: pMeta.tint + '40', background: pMeta.tint + '12' }}
          >
            {note}
          </span>
        ))}
        <span className="text-[11px] rounded-full px-2.5 py-1 border border-stone-700 text-stone-400">
          {phone.screenInches}" {phone.displayType}
        </span>
      </div>

      <button
        onClick={() => onToggleCompare(phone.id)}
        aria-pressed={selected}
        disabled={!selected && !canSelectMore}
        title={!selected && !canSelectMore ? `You can compare up to ${MAX_COMPARE} phones` : undefined}
        className={cx(
          'mt-auto w-full rounded-full py-2.5 text-sm font-semibold border transition-all duration-200',
          selected
            ? 'text-white border-transparent'
            : 'border-stone-600 text-stone-300 hover:border-stone-400 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        style={selected ? { background: pMeta.tint } : undefined}
      >
        <i className={cx('mr-2 text-xs', selected ? 'fa-solid fa-check' : 'fa-solid fa-code-compare')} />
        {selected ? 'Added to compare' : 'Compare'}
      </button>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPARE (tray + modal)
// ─────────────────────────────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { label: 'Fit score', get: (e) => e.match, fmt: (v) => `${v}%`, best: 'high' },
  { label: 'Price', get: (e) => e.phone.priceINR, fmt: inrFormat, best: 'low' },
  { label: 'Rating', get: (e) => e.phone.rating, fmt: (v) => `${v} / 5`, best: 'high' },
  { label: 'Battery', get: (e) => e.phone.batteryMah, fmt: (v) => `${v.toLocaleString()} mAh`, best: 'high' },
  { label: 'RAM', get: (e) => e.phone.ramGB, fmt: (v) => `${v} GB`, best: 'high' },
  { label: 'Storage', get: (e) => e.phone.storageGB, fmt: formatStorage, best: 'high' },
  { label: 'Camera', get: (e) => e.phone.cameraMP, fmt: (v) => (v > 0 ? `${v} MP` : 'Not listed'), best: 'high' },
  { label: 'Weight', get: (e) => e.phone.weightGrams, fmt: (v) => `${v} g`, best: 'low' },
  { label: 'Screen', get: (e) => e.phone.screenInches, fmt: (v) => `${v}"`, best: null },
  { label: 'Display', get: (e) => e.phone.displayType, fmt: (v) => v, best: null },
];

const CompareTray = ({ entries, tint, onRemove, onClear, onOpen }) => (
  <div
    className="pf-tray fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl flex items-center gap-3 rounded-full bg-[#14151B]/95 backdrop-blur-xl border border-stone-600 shadow-2xl pl-4 pr-2 py-2"
    role="region"
    aria-label="Compare tray"
  >
    <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto">
      {entries.map(({ phone }) => (
        <span
          key={phone.id}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-stone-200 rounded-full pl-3 pr-1.5 py-1 border"
          style={{ borderColor: tint + '66', background: tint + '14' }}
        >
          <span className="max-w-[110px] truncate">{phone.name}</span>
          <button
            onClick={() => onRemove(phone.id)}
            aria-label={`Remove ${phone.name} from comparison`}
            className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400"
          >
            <i className="fa-solid fa-xmark text-[9px]" />
          </button>
        </span>
      ))}
      {entries.length < 2 && <span className="text-xs text-stone-500 flex-shrink-0">Pick one more to compare</span>}
    </div>
    <button onClick={onClear} className="text-xs text-stone-400 hover:text-stone-200 px-2 flex-shrink-0">
      Clear
    </button>
    <button
      id="open-compare"
      onClick={onOpen}
      disabled={entries.length < 2}
      className={cx(
        'flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all',
        entries.length >= 2 ? 'btn-primary hover:scale-105' : 'bg-white/10 text-stone-500 cursor-not-allowed'
      )}
    >
      Compare {entries.length}
    </button>
  </div>
);

const CompareModal = ({ entries, tint, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const rows = COMPARE_ROWS.map((row) => {
    const values = entries.map((entry) => row.get(entry));
    let winners = [];
    if (row.best && typeof values[0] === 'number') {
      const target = row.best === 'high' ? Math.max(...values) : Math.min(...values);
      const allSame = values.every((v) => v === values[0]);
      if (!allSame) winners = values.map((v, i) => (v === target ? i : -1)).filter((i) => i >= 0);
    }
    return { ...row, values, winners };
  });
  const wins = entries.map((_, i) => rows.filter((r) => r.winners.includes(i)).length);
  const topWins = Math.max(...wins);
  const cols = { gridTemplateColumns: `110px repeat(${entries.length}, minmax(130px, 1fr))` };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare phones"
        className="relative w-full max-w-3xl bg-panel rounded-3xl shadow-2xl animate-modal-in max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-display font-semibold text-ink">Side-by-side comparison</h2>
          <button
            onClick={onClose}
            aria-label="Close comparison"
            className="w-8 h-8 rounded-full bg-white/[0.06] text-stone-400 hover:bg-white/10 hover:rotate-90 transition-all flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-x-auto">
          <div className="min-w-[440px]">
            <div className="grid gap-3 pb-4" style={cols}>
              <div />
              {entries.map((entry, i) => (
                <div key={entry.phone.id} className="text-center">
                  {wins[i] === topWins && topWins > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 mb-1.5" style={{ color: tint, background: tint + '1F' }}>
                      <i className="fa-solid fa-crown" /> Most wins
                    </span>
                  )}
                  <p className="font-display font-semibold text-ink text-sm leading-snug">{entry.phone.name}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{entry.phone.brand}</p>
                </div>
              ))}
            </div>

            {rows.map((row, r) => (
              <div
                key={row.label}
                className={cx('pf-rise grid gap-3 items-center py-2.5 border-t border-stone-800', r % 2 === 0 && 'bg-white/[0.02]')}
                style={{ ...cols, '--i': r }}
              >
                <span className="text-xs text-stone-400 pl-2">{row.label}</span>
                {row.values.map((value, i) => {
                  const win = row.winners.includes(i);
                  return (
                    <span
                      key={entries[i].phone.id}
                      className={cx('text-center text-sm font-mono rounded-lg py-1', win ? 'font-bold' : 'text-stone-300')}
                      style={win ? { color: tint, background: tint + '1A' } : undefined}
                    >
                      {row.fmt(value)}
                      {win && <i className="fa-solid fa-circle-check text-[10px] ml-1.5" />}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-stone-500">
            Highlighted values are the best in each row. Scores use only client-supplied specs.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  STAGE 3 · RESULTS
// ─────────────────────────────────────────────────────────────────────────────

const StatTile = ({ icon, label, value, format = (v) => v, tint, index }) => {
  const n = useCountUp(value);
  return (
    <div
      className="pf-rise rounded-2xl border border-stone-700 bg-panel px-4 py-3.5 flex items-center gap-3"
      style={{ '--i': index }}
    >
      <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tint + '1F', color: tint }}>
        <i className={icon} />
      </span>
      <div>
        <div className="text-xl font-mono font-bold text-ink tabular-nums leading-tight">{format(n)}</div>
        <div className="text-[11px] uppercase tracking-wider text-stone-500">{label}</div>
      </div>
    </div>
  );
};

const SORTS = [
  { key: 'match', label: 'Best fit', icon: 'fa-solid fa-bullseye' },
  { key: 'price', label: 'Lowest price', icon: 'fa-solid fa-indian-rupee-sign' },
  { key: 'rating', label: 'Top rated', icon: 'fa-solid fa-star' },
  { key: 'battery', label: 'Biggest battery', icon: 'fa-solid fa-battery-full' },
];

const ResultsStage = ({ purpose, prefs, results, onRefine, onRestart }) => {
  const pMeta = purposeMeta(purpose);
  const bMeta = budgetMeta(prefs.budget);
  const sizeLabel = { compact: 'Compact screen', standard: 'Standard screen', large: 'Large screen' }[prefs.size] || null;

  const [browseAll, setBrowseAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('any');
  const [sortBy, setSortBy] = useState('match');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

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

  // Start from the first page again whenever the explorer filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, brandFilter, sortBy]);

  const visibleResults = browseAll ? exploredResults.slice(0, visibleCount) : results.list.slice(0, 4);

  const toggleCompare = useCallback((id) => {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]));
  }, []);
  const closeCompare = useCallback(() => setCompareOpen(false), []);

  const compareEntries = compareIds
    .map((id) => results.list.find(({ phone }) => phone.id === id))
    .filter(Boolean);

  // Header stats
  const stats = useMemo(() => {
    const list = results.list;
    if (!list.length) return null;
    const prices = list.map(({ phone }) => phone.priceINR);
    return {
      count: list.length,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      topRating: Math.max(...list.map(({ phone }) => Number(phone.rating) || 0)),
    };
  }, [results.list]);

  const topBadge = (i) => (i === 0 ? '★ Best match' : '#' + (i + 1));

  return (
    <main className="relative max-w-6xl mx-auto px-5 sm:px-8 pb-32 overflow-x-clip">
      <div className="pf-orb w-[380px] h-[380px] -top-24 right-0" style={{ background: pMeta.tint, opacity: 0.18 }} aria-hidden="true" />

      <section className="relative pt-12 sm:pt-16 pb-8">
        <p className="pf-rise text-xs font-semibold tracking-[0.2em] uppercase text-accent">Step 3 of 3 · Your matches</p>
        <h1 className="pf-rise mt-3 text-3xl sm:text-[44px] leading-tight font-display font-extrabold text-ink" style={{ '--i': 1 }}>
          Tailored for <span style={{ color: pMeta.tint }}>{pMeta.label}</span>
        </h1>

        <div className="pf-rise flex flex-wrap items-center gap-2 mt-5" style={{ '--i': 2 }}>
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 hover:scale-105 px-3 py-1.5 rounded-full transition-all"
          >
            <i className="fa-solid fa-sliders text-[10px]" />
            Refine
          </button>
        </div>

        {stats && (
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <StatTile index={3} icon="fa-solid fa-mobile-screen" label="Models in range" value={stats.count} tint={pMeta.tint} />
            <StatTile index={4} icon="fa-solid fa-tag" label="Average price" value={stats.avgPrice} format={inrFormat} tint={pMeta.tint} />
            <StatTile index={5} icon="fa-solid fa-star" label="Top rating" value={Math.round(stats.topRating * 10)} format={(v) => (v / 10).toFixed(1)} tint={pMeta.tint} />
          </div>
        )}

        <p className="mt-4 text-xs text-stone-500">
          Prices are estimates: client USD × ₹{DATASET_META.usdToInrRate.toFixed(2)} ({DATASET_META.conversionDate}). Fit score is a rule-based indicator, not a benchmark.
        </p>

        {results.relaxed.length > 0 && (
          <p className="mt-4 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3.5 py-2.5 inline-block">
            <i className="fa-solid fa-circle-info mr-1.5 text-amber-300" />
            Too few matches, so your {results.relaxed.join(' and ')} preference was relaxed.
          </p>
        )}
      </section>

      {results.list.length === 0 ? (
        <section className="text-center py-20 bg-panel rounded-3xl border border-stone-700 animate-fade-up">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-plum/10">
            <i className="fa-solid fa-magnifying-glass text-2xl text-plum" />
          </div>
          <h2 className="mt-4 text-lg font-display font-semibold text-ink">No phones match those filters</h2>
          <p className="mt-2 text-sm text-stone-400">Try another budget range or screen size.</p>
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
                : `Top ${Math.min(4, results.list.length)} picks`}
            </p>
            <button
              id="toggle-catalog-browser"
              onClick={() => {
                setBrowseAll((open) => !open);
                setVisibleCount(PAGE_SIZE);
              }}
              className="px-4 py-2 rounded-full border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/10 hover:scale-105 transition-all"
            >
              <i className={cx('mr-2 text-xs', browseAll ? 'fa-solid fa-star' : 'fa-solid fa-layer-group')} />
              {browseAll ? 'Show top picks' : `Browse all ${results.list.length}`}
            </button>
          </div>

          {browseAll && (
            <div className="pf-rise mb-6 p-4 rounded-2xl border border-stone-700 bg-panel space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">Search model or brand</span>
                  <span className="relative block">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500" />
                    <input
                      id="catalog-search"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="e.g. Voltix"
                      className="w-full rounded-xl border border-stone-700 bg-black/30 pl-9 pr-3 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-accent focus:outline-none"
                    />
                  </span>
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
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div id="catalog-sort" role="group" aria-label="Sort by" className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    aria-pressed={sortBy === s.key}
                    className={cx(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-150 hover:-translate-y-0.5',
                      sortBy === s.key
                        ? 'text-white border-transparent shadow-glow bg-gradient-to-r from-accent to-plum'
                        : 'bg-white/[0.03] text-stone-300 border-stone-700 hover:border-accent/50 hover:text-accent'
                    )}
                  >
                    <i className={cx(s.icon, 'text-[10px]')} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleResults.length === 0 ? (
            <p className="rounded-2xl border border-stone-700 bg-panel p-8 text-center text-stone-400">
              No models match that search. Clear the search or choose another brand.
            </p>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {visibleResults.map((entry, i) => (
                <ResultCard
                  key={entry.phone.id}
                  entry={entry}
                  purpose={purpose}
                  rank={i}
                  badge={!browseAll ? topBadge(i) : undefined}
                  selected={compareIds.includes(entry.phone.id)}
                  canSelectMore={compareIds.length < MAX_COMPARE}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </section>
          )}

          {browseAll && visibleResults.length < exploredResults.length && (
            <div className="mt-7 text-center">
              <button
                id="load-more-models"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="px-5 py-2.5 rounded-full border border-stone-600 text-stone-200 text-sm font-semibold hover:border-accent hover:text-accent hover:scale-105 transition-all"
              >
                Load {Math.min(PAGE_SIZE, exploredResults.length - visibleResults.length)} more · {exploredResults.length - visibleResults.length} remaining
              </button>
            </div>
          )}
        </>
      )}

      <section className="mt-14 text-center">
        <p className="text-sm text-stone-500">Not quite right?</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            id="restart-flow"
            onClick={onRestart}
            className="px-6 py-3 rounded-full border border-stone-600 text-stone-300 text-sm font-semibold hover:border-stone-500 hover:bg-white/[0.06] transition-all"
          >
            <i className="fa-solid fa-rotate-left mr-2 text-xs" />
            Start over
          </button>
          <button id="refine-bottom" onClick={onRefine} className="px-6 py-3 rounded-full text-sm font-semibold btn-primary hover:scale-105 transition-transform">
            <i className="fa-solid fa-sliders mr-2 text-xs" />
            Adjust budget &amp; filters
          </button>
        </div>
      </section>

      {compareEntries.length > 0 && (
        <CompareTray
          entries={compareEntries}
          tint={pMeta.tint}
          onRemove={toggleCompare}
          onClear={() => setCompareIds([])}
          onOpen={() => setCompareOpen(true)}
        />
      )}
      {compareOpen && compareEntries.length >= 2 && (
        <CompareModal entries={compareEntries} tint={pMeta.tint} onClose={closeCompare} />
      )}
    </main>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP — stage controller
// ─────────────────────────────────────────────────────────────────────────────

const App = () => {
  // 'landing' → 'loading' (short animation) → 'results'
  const [stage, setStage] = useState('landing');
  const [modalOpen, setModalOpen] = useState(false);
  const [purpose, setPurpose] = useState(null);
  const [prefs, setPrefs] = useState({ budget: null, size: 'any' });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  // The loading animation hands over to the results after a moment
  useEffect(() => {
    if (stage !== 'loading') return undefined;
    const timer = setTimeout(() => setStage('results'), prefersReducedMotion() ? 250 : RESULTS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const handleSelectPurpose = useCallback((key) => {
    setPurpose(key);
    setModalOpen(true);
  }, []);

  const handleSubmitPrefs = useCallback((draft) => {
    if (!draft.budget) return;
    setPrefs(draft);
    setModalOpen(false);
    setStage('loading');
  }, []);

  const handleRestart = useCallback(() => {
    setPurpose(null);
    setPrefs({ budget: null, size: 'any' });
    setModalOpen(false);
    setStage('landing');
  }, []);

  const handleRefine = useCallback(() => setModalOpen(true), []);
  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  const results = useMemo(() => {
    if (stage !== 'results' || !purpose || !prefs.budget) return { list: [], relaxed: [] };
    return getRecommendations({ purpose, budget: prefs.budget, size: prefs.size, limit: Infinity });
  }, [stage, purpose, prefs]);

  const progressStep = modalOpen ? 1 : stage === 'landing' ? 0 : 2;

  return (
    <div className="min-h-screen text-stone-100 font-sans">
      <TopBar step={progressStep} onHome={handleRestart} showHome={stage !== 'landing'} />

      {stage === 'landing' && <LandingStage onSelectPurpose={handleSelectPurpose} />}

      {stage === 'loading' && purpose && <LoadingStage purpose={purpose} />}

      {stage === 'results' && purpose && prefs.budget && (
        <ResultsStage
          key={purpose + '|' + prefs.budget + '|' + prefs.size}
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
          initialPrefs={prefs}
          onSubmit={handleSubmitPrefs}
          onClose={handleCloseModal}
          isRefine={stage === 'results'}
        />
      )}

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