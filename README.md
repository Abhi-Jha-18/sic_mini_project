# PhoneFit — Smart Mobile Recommendation Tool

PhoneFit is a React + Vite app that recommends phones from the **client-provided phone dataset**. A visitor selects a use case, an INR budget band, and optionally a screen-size preference; the app ranks matching dataset records using transparent local heuristics.

## Run locally

```bash
npm ci
npm run dev       # Vite development server
npm test          # unit and UI tests
npm run build      # production output in dist/
```

## Client dataset

The original client file is preserved at:

```text
data/sic_mobile_spec_PJ1 - Sheet1.csv
```

It has 413 phone records and these source columns: `name`, `rating`, `price`, `camera`, `display_type`, `display_size`, `battery`, `storage`, `ram`, `weight`, and `processor`.

The live app imports the normalized copy at `src/data/clientPhones.json`. To regenerate it after the source CSV changes, run:

```bash
npm run data:prepare
```

The conversion retains every record, keeps each original `priceUSD`, and adds a rounded `priceINR` using a fixed indicative rate of **$1 = ₹95.13** (dated 2026-10-28). It also converts `1TB` storage to 1,024 GB for sorting/display, maps `other_types` to “Other / not specified”, and treats `not mentioned` processors as missing. Each row receives a stable ID based on its CSV row order. The original CSV remains the source of truth. The displayed INR prices and Indian budget tiers are estimates; the rate can be updated in `src/data/currency.js` before rerunning the conversion.

## Recommendation behavior and data limitations

The app uses Indian-rupee budget bands: **under ₹20,000**, **₹20,000–₹50,000**, and **above ₹50,000**. The results page leads with four top matches and can expand into a searchable browser for every matching record. The expanded catalog supports model/brand search, brand filtering, sorting by match, price, rating, or battery capacity, and incremental loading. Budget options show the live number of matching models.

The ranking is deterministic and scores only fields supplied by the client: customer rating, RAM, battery capacity, camera megapixels, display type/size, and storage. Scores are rule-based matching indicators, not laboratory benchmarks or AI-generated assessments.

The source does not include operating system, refresh rate, processor benchmarks, camera sensor/quality details, or charging speed. The app therefore does not infer those properties or offer an OS filter. It displays the supplied processor label as-is and labels missing values as unavailable. The result cards show client-listed facts rather than invented editorial pros and cons.

## Project structure

```text
data/                                  # Original client spreadsheet
outputs/                               # Generated recommendation demo output
scripts/prepare-client-dataset.mjs     # CSV → normalized JSON conversion
scripts/demo.mjs                       # Example recommendation scenarios
src/App.jsx                             # React UI and user journey
src/data/mockDatabase.js               # Active client-backed catalog and ranking
src/data/clientPhones.json              # Normalized app-ready client records
src/data/mockDatabase.test.js           # Dataset and engine tests
src/wizard/                             # Separate framework-agnostic wizard modules
```

The app uses the client-backed catalog in `src/data/mockDatabase.js`. The separate `src/wizard/` modules are not the active data source for the current React UI.

## Security and submission archive

No API credentials are needed by this app. `PhoneFit_Codebase_Archive.zip` contains the code, original and normalized client datasets, README, scripts, tests, and generated demo output; it excludes `.git`, installed dependencies, build outputs, and local environment files.
