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
* **Minimalism** — ample white space, hairline borders, soft shadows, light warm off-white canvas.
* **Modern typography** — Inter, tight-tracked headings, clear weight contrast.
* **Muted color palette** — desaturated slate-blue accent plus subtle per-purpose tints.

## Tech Stack
* React (CRA) with hooks (`useState` / `useMemo` / `useEffect`)
* Tailwind CSS (CDN) for styling
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
npm start        # http://localhost:3000
npm test
npm run build
```

> **Note:** the scripts run CRA's webpack 4 toolchain with
> `NODE_OPTIONS=--openssl-legacy-provider` so they work on Node 17+.
> On Node 16 and older, you can remove that flag from `package.json`.

## Project Structure

```
src/
  App.js                  # 3-stage flow: Landing → Modal → Results
  data/mockDatabase.js    # Purposes, budget tiers, phone catalog, scoring engine
public/
  index.html              # Tailwind theme (muted minimalist palette + animations)
```
