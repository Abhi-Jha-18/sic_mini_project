# PhoneFit — Smart Mobile Recommendation Tool

> Samsung Innovation Campus (SIC) mini project  
> **Author:** <Abhi Jha> · **Batch/Track:** < 3rd Batch / AI/ML > ·

PhoneFit is a React + Vite web app that recommends phones from a **client-provided dataset of 413 phone records**. A visitor picks a use case, an INR budget band, and (optionally) a screen-size preference. The app then ranks matching phones with transparent, rule-based scoring.

**Live demo:** <add link if deployed>

<!-- Add 2–3 screenshots here, e.g. ![Results page](docs/results.png) -->

## Features

- Three-step guided flow: use case → budget → screen size
- Indian-rupee budget bands with a live count of matching models
- Top 4 matches up front, expandable into a full catalog browser
- Search by model/brand, brand filter, and sorting by match, price, rating, or battery
- Incremental loading for the full catalog
- Animated landing page with 3D-tilt, cursor-spotlight priority cards
- Animated "finding your matches" transition and count-up statistics
- Result cards with an animated fit-score ring and spec meters (battery, RAM, camera, storage)
- Side-by-side comparison of up to 3 phones, with the best value in each row highlighted
- Respects the system "reduce motion" setting
- Deterministic, explainable scoring (no black-box AI)

## Tech stack

React · Vite · Tailwind CSS · Font Awesome icons · JavaScript (ES modules) · Node.js scripts for data preparation · unit/UI tests (`npm test`)

## Getting started

**Requirements:** Node.js 18+ and npm.

```bash
npm ci               # install dependencies
npm run dev          # start the Vite dev server
npm test             # run unit and UI tests
npm run build        # production build in dist/
npm run data:prepare # regenerate normalized dataset from the CSV
```

## Dataset

The original client file is kept unchanged at `data/sic_mobile_spec_PJ1 - Sheet1.csv`.

| Item | Detail |
|---|---|
| Records | 413 |
| Source columns | `name`, `rating`, `price`, `camera`, `display_type`, `display_size`, `battery`, `storage`, `ram`, `weight`, `processor` |
| App-ready copy | `src/data/clientPhones.json` |

`npm run data:prepare` converts the CSV into the app-ready JSON:

- Keeps every record, with a stable ID based on CSV row order
- Keeps the original `priceUSD` and adds a rounded `priceINR` at an indicative rate of **$1 = ₹95.13** (dated 2026-10-28; change it in `src/data/currency.js` and rerun)
- Converts `1TB` storage to 1,024 GB
- Maps `other_types` to "Other / not specified"
- Treats `not mentioned` processors as missing

The CSV remains the source of truth. INR prices and budget tiers are **estimates**.

## How recommendations work

**Budget bands:** under ₹20,000 · ₹20,000–₹50,000 · above ₹50,000

Scoring uses only fields present in the dataset: customer rating, RAM, battery capacity, camera megapixels, display type/size, and storage. Scores are rule-based matching indicators, not lab benchmarks or AI-generated assessments.

### Limitations

The dataset has no operating system, refresh rate, processor benchmarks, camera sensor quality, or charging speed. PhoneFit does not guess these, offers no OS filter, shows the processor label as supplied, and marks missing values as unavailable. Result cards show client-listed facts only, not invented pros and cons.

## Project structure

```text
data/                                # Original client spreadsheet
outputs/                             # Generated recommendation demo output
scripts/prepare-client-dataset.mjs   # CSV → normalized JSON
scripts/demo.mjs                     # Example recommendation scenarios
src/App.jsx                          # React UI and user journey
src/phonefit-ui.css                  # Animations and interaction styles
src/data/mockDatabase.js             # Active client-backed catalog and ranking engine (consider renaming to phoneCatalog.js)
src/data/clientPhones.json           # Normalized app-ready records
src/data/mockDatabase.test.js        # Dataset and engine tests
src/wizard/                          # Standalone wizard modules (not used by the current UI)
```

## Submission archive

`PhoneFit_Codebase_Archive.zip` contains the code, original and normalized datasets, README, scripts, tests, and demo output. It excludes `.git`, `node_modules`, build output, and local environment files. The app needs no API keys.

## Acknowledgements

Built as part of the Samsung Innovation Campus program. Dataset provided by the client.

## License

<IET KHANDARI, or "For academic submission only">