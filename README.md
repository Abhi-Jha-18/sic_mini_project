# PhoneFit – Smart Mobile Recommendation Tool

**Samsung Innovation Campus (SIC) – Mini Project**

- **Author:** Abhi Jha
- **Batch/Track:** 3rd Batch / AI/ML
- **Project:** PhoneFit

## Project Overview

PhoneFit is a React + Vite web application that recommends smartphones using a client-provided dataset containing 413 phone records.

Users select their preferred use case, INR budget range, and optional screen-size preference. The application then ranks matching smartphones using transparent, deterministic, rule-based scoring.

The goal is to simplify smartphone selection by providing relevant recommendations, detailed specifications, and side-by-side comparisons.

**Live Demo:** Add deployment URL if available.

## Features

- Three-step guided recommendation flow: Use Case → Budget → Screen Size.
- Indian Rupee budget bands with live matching-model counts.
- Top 4 recommendations with access to the full catalog.
- Search by phone model or brand.
- Brand filtering and sorting by match score, price, rating, and battery.
- Incremental catalog loading.
- Animated landing page with interactive visual effects.
- Animated recommendation-loading transition and statistics.
- Smartphone result cards with fit-score rings and specification meters.
- Side-by-side comparison of up to 3 smartphones.
- Highlights the best value in each comparison category.
- Supports system-level reduced-motion preferences.
- Explainable, deterministic recommendation scoring.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| Tailwind CSS | Styling |
| Font Awesome | Icons |
| Node.js | Dataset preparation scripts |
| npm | Dependency management |
| React Testing | Application testing |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Abhi-Jha-18/sic_mini_project.git
cd sic_mini_project
```

Install dependencies:

```bash
npm ci
```

### Run the application

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Run tests

```bash
npm test
```

### Create production build

```bash
npm run build
```

### Prepare the dataset

```bash
npm run data:prepare
```

This command regenerates the normalized smartphone dataset from the original CSV file.

## Dataset Information

The project uses a client-provided CSV dataset containing 413 smartphone records.

**Original dataset:**

`data/sic_mobile_spec_PJ1 - Sheet1.csv`

A submission copy is also provided in:

`datasets/sic_mobile_spec_PJ1 - Sheet1.csv`

| Attribute | Details |
|---|---|
| Total records | 413 |
| Original format | CSV |
| Processed format | JSON |
| Normalized dataset | `src/data/clientPhones.json` |

### Source Columns

- name
- rating
- price
- camera
- display_type
- display_size
- battery
- storage
- ram
- weight
- processor

### Data Processing

The `scripts/prepare-client-dataset.mjs` script:

- Validates the expected CSV columns.
- Preserves smartphone records and assigns stable IDs based on row order.
- Retains the original USD price.
- Calculates an estimated INR price.
- Converts TB storage into GB.
- Normalizes unspecified display types.
- Treats missing processor information as unavailable.

The currency conversion uses an indicative rate of **$1 = ₹95.13**, dated October 28, 2026. The rate can be updated in `src/data/currency.js`.

The original CSV remains the source of truth. INR prices and budget categories are estimates.

## Recommendation System

PhoneFit uses deterministic, rule-based scoring to rank smartphones according to user preferences.

### Budget Categories

- Below ₹20,000
- ₹20,000–₹50,000
- Above ₹50,000

### Scoring Parameters

The recommendation engine considers:

- Customer rating
- RAM capacity
- Battery capacity
- Camera megapixels
- Display type and size
- Storage capacity

The resulting score indicates how well a smartphone matches the selected preferences. It is not an independent laboratory benchmark or an AI-generated assessment.

## Project Structure

```text
AbhiJha_PhoneFit/
│
├── notebooks/
│   └── README.md
│
├── prompts/
│   └── README.md
│
├── datasets/
│   ├── README.md
│   └── sic_mobile_spec_PJ1 - Sheet1.csv
│
├── outputs/
│   └── demo-output.txt
│
├── data/
│   └── sic_mobile_spec_PJ1 - Sheet1.csv
│
├── scripts/
│   ├── demo.mjs
│   └── prepare-client-dataset.mjs
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── App.test.jsx
│   ├── index.jsx
│   ├── index.css
│   ├── phonefit-ui.css
│   │
│   ├── data/
│   │   ├── clientPhones.json
│   │   ├── currency.js
│   │   ├── mockDatabase.js
│   │   └── mockDatabase.test.js
│   │
│   └── wizard/
│       ├── catalog.js
│       ├── config.js
│       ├── engine.js
│       ├── index.js
│       ├── schemas.js
│       ├── state.js
│       └── wizard.test.js
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
└── README.md
```

**Folder descriptions:**

- `notebooks/`: Documentation about the project's JavaScript-based development approach. No Jupyter notebooks are currently required.
- `prompts/`: Documentation of recommendation logic and any applicable prompt templates. No external AI prompts are currently used.
- `datasets/`: Original dataset copy and dataset documentation.
- `outputs/`: Sample generated outputs and demonstration logs.
- `scripts/`: Dataset processing and demonstration scripts.
- `src/`: React application, data handling, recommendation engine and tests.
- `public/`: Static application assets.
- `data/`: Original dataset location retained for compatibility with the preparation script.

## Limitations

The provided dataset does not include operating system, display refresh rate, processor benchmarks, camera sensor quality, or charging speed.

PhoneFit does not estimate missing specifications. It displays available information and marks missing values accordingly.

The recommendations are based on available dataset attributes and user preferences.

## APIs and Dependencies

The project uses a locally processed smartphone dataset and does not currently require external API keys.

Dependencies are managed through `package.json` and `package-lock.json`.

## Submission Archive

The final submission archive is named:

`AbhiJha_PhoneFit.zip`

It includes the source code, documentation, datasets, scripts, tests and sample outputs.

It excludes unnecessary generated dependencies, Git history and local environment files.

## Acknowledgements

Developed as part of the Samsung Innovation Campus program.

The smartphone dataset was provided by the client.

## License

For academic submission purposes. No separate open-source license is specified.