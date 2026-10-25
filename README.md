# PhoneFit — Smart Mobile Recommendation Tool

A React web app that recommends mobile phones through a clean, minimalist **3-stage flow**.
Instead of overwhelming users with spec tables, PhoneFit asks two focused questions and
returns a shortlist of 3–4 tailored recommendations with concise pros & cons.

## User Journey — 3 Distinct Stages

### Stage 1 · Landing Page
* Clean headline and subtitle introducing the service.
* Interactive prompt: *"What is the primary purpose or main feature you need in your
  mobile phone?"*
  * Gaming
  * Photography/Videography
  * Daily Work &amp; Battery Life
  * Media Consumption/Display
  * General Everyday Use

### Stage 2 · Inner Modal (Budget &amp; Preferences)
* Smoothly transitions into a focused modal once a purpose is selected.
* Target **Price Range / Budget**:
  * Entry-level (under ₹20,000)
  * Mid-range (₹20,000 – ₹50,000)
  * Flagship (above ₹50,000)
* *Optional quick toggles:* OS preference (iOS vs. Android) and screen size
  (Compact ≤ 6.3" / Large ≥ 6.6").

### Stage 3 · Tailored Results
* Minimalist card layout with **3–4 top recommendations** matched to the selected
  purpose and budget.
* Each card shows:
  * Phone name &amp; image placeholder
  * Price
  * Key highlights tailored to the selected primary purpose
  * Concise pros &amp; cons
* "Refine" reopens the modal with the current selections; "Start over" returns to Stage 1.

## Design Language
* **Dark minimalism** — true-black canvas (`#08090C`) washed with faint fixed colour blooms,
  raised `#141419` panels, hairline `#2A2A33` borders, glows instead of drop shadows.
* **Typography** — **Gabarito** (geometric sans, 400–900; display & body, black-weight hero),
  **JetBrains Mono** tabular figures for prices, ranges and spec lines.
* **Colour mosaic** — black-tuned denim accent (`#7FA0C9`) plus four purpose tones brightened
  from the dataset: plum `#9C8BD8` (gaming), terra `#D0967B` (camera), sage `#8FC1A4`
  (battery), taupe `#C9B98F` (everyday). Cards, chips and modal headers inherit the selected
  purpose's tint via a `--tint` CSS variable; CTAs use a denim→plum gradient with a neon glow;
  match badges band by confidence (sage ≥ 85 · amber ≥ 70 · rose below).

---

## Logic Layer — `src/wizard/` (framework-agnostic)

The wizard's **brain** lives in `src/wizard/`: pure JavaScript — no React, no
DOM, no styling — so it can drive the web UI, a test suite, or
`node scripts/demo.mjs` equally well.

### The 3-step pipeline

| Step | Module surface | What happens |
|------|----------------|--------------|
| **1 · Primary Need** | `NEEDS`, `selectNeed()` | User picks one of *camera / gaming / battery / display / everyday*. Picking **gaming** pre-fills sensible spec floors (8 GB RAM, 120 Hz) as *editable* defaults. |
| **2 · Specs & Price** | `BUDGET_TIERS`, spec/OS option lists, `updateRequirements()` | Budget as a **tier** (*Under $300 / $300–600 / $600–1,000 / $1,000+*) **or an exact amount** (+5 % street-price grace). Priority specs (min RAM / storage / battery / refresh rate, chipset preference, camera setup) and OS are collected. `validateStep2()` blocks advance until coherent. |
| **3 · Engine & Output** | `recommend()` | Hard-filter → relax-until-3 → score → dress cards. Guaranteed **3–4 recommendations** for *any* valid input. |

### Engine behaviour
1. **Hard filters** — price window, OS, every set spec constraint.
2. **Staged relaxation** (each drop logged in `relaxations[]` with a human note):
   `cameraSetup → minRefreshHz → minBatteryMAh → minStorageGB → minRamGB → budget (stepwise)`
   — OS is *never* relaxed while any phone honours it.
   A relaxed-but-satisfied constraint earns a **compliance bonus** (+12), so e.g.
   the only telephoto phone under $600 still tops a camera list. Over-budget
   picks are penalised by overspend ratio — a $1,199 phone can't outrank a $599
   one for a $300 budget.
3. **Scoring** — need-weighted blend of five 0–100 attribute scores
   (`NEED_WEIGHTS`) + chipset-preference bonus + exact-budget efficiency bonus.

### State handling
`state.js` exposes `initialWizardState`, a pure `reducer`, and action creators
(`selectNeed`, `updateRequirements`, `setExactAmount`, `nextStep`, `prevStep`,
`refine`, `startOver`) — plug straight into `useReducer`, or use the built-in
`createWizard()` observable store. Invariants: **input edits always invalidate
cached results**, NEXT is gated by per-step validators, `REFINE` preserves
inputs and `START_OVER` resets everything.

### Data contracts (JSON Schema 2020-12)
`schemas.js` exports `STEP_1_INPUT_SCHEMA`, `STEP_2_INPUT_SCHEMA`,
`RECOMMENDATION_SET_SCHEMA`. Each Step-3 card carries: `brand`/`model`,
`estimatedPrice` (amount, label, `withinSelectedBudget`), `primaryFitReason`,
`keySpecs` (processor / memory / display / battery / cameras), `matchScore`,
2–3 `pros`, 2–3 `cons`.

### Catalog
`catalog.js` — 21 phones of the **October 2026** market (S26 series, iPhone 17
family, Pixel 10 family, OnePlus 15, REDMAGIC 11 Pro, iQOO 15, Pixel 10a,
Galaxy A57/A36/A17, CMF Phone 2 Pro, …) with raw specs, editorial 0–100
attribute scores and curated pros/cons. Prices are USD; to serve India, swap
`BUDGET_TIERS` bounds and the catalog's `priceUSD` for ₹ figures — the engine
reads nothing else price-related. (`src/data/mockDatabase.js` is the app's
legacy ₹ dataset; the wizard layer supersedes it.)

### Verify
```bash
npm test               # 30 tests — includes the 5 needs × 4 tiers × 3 OS guarantee matrix
node scripts/demo.mjs  # three end-to-end personas; prints exact Step-3 payloads
```
* **Muted color palette** — desaturated slate-blue accent plus subtle per-purpose tints.

## Tech Stack
* React 18 + Vite (dev server & build) with hooks (`useState` / `useMemo` / `useEffect`)
* Tailwind CSS (CDN) for styling
* Vitest + jsdom for tests
* No router or state libraries — the journey is a small, explicit state machine
  (`landing → modal → results`) so the stages never bleed into each other.

## Recommendation Engine
Each phone in `src/data/mockDatabase.js` is scored per purpose (0–100):

| Purpose | Weighting |
| --- | --- |
| Gaming | Processor 55% · RAM 20% · Refresh rate 10% · Battery 15% |
| Photography/Videography | Camera 75% · Processor (ISP) 15% · Storage 10% |
| Daily Work & Battery Life | Battery 55% · Processor 25% · RAM 20% |
| Media Consumption/Display | Display 60% · Battery 20% · Storage 10% · Refresh 10% |
| General Everyday Use | Processor / Camera / Battery / Display — 25% each |

If optional filters (OS / screen size) would leave fewer than 3 matches, they are
relaxed automatically and the UI says so.

## Getting Started

```bash
npm install
npm start        # http://localhost:3000 (alias: npm run dev)
npm test         # Vitest suite
npm run build    # production build → dist/
```

## Project Structure

```
index.html               # Tailwind theme (muted minimalist palette + animations)
vite.config.js           # Vite + Vitest configuration
src/
  App.jsx                # 3-stage flow: Landing → Modal → Results
  data/mockDatabase.js   # Purposes, budget tiers, phone catalog, scoring engine
```
