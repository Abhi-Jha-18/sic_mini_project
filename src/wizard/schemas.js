// =============================================================================
//  src/wizard/schemas.js — data contracts for the 3-step wizard (JSON Schema)
//
//  Draft 2020-12-compatible schemas kept as plain JS objects so they can be
//  imported, unit-tested, and serialised to .json files for tooling. They
//  describe exactly what crosses step boundaries:
//
//    STEP_1_INPUT_SCHEMA          user → engine  (Step 1 payload)
//    STEP_2_INPUT_SCHEMA          user → engine  (Step 2 payload)
//    RECOMMENDATION_SET_SCHEMA    engine → user   (Step 3 output)
// =============================================================================

export const STEP_1_INPUT_SCHEMA = {
  $id: 'phonefit://schemas/step1-input',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Step1Input — primary need selection',
  type: 'object',
  additionalProperties: false,
  required: ['need'],
  properties: {
    need: {
      type: 'string',
      enum: ['camera', 'gaming', 'battery', 'display', 'everyday'],
      description: 'The single primary use case the phone must excel at.',
    },
  },
};

export const STEP_2_INPUT_SCHEMA = {
  $id: 'phonefit://schemas/step2-input',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Step2Input — budget, priority specs, OS preference',
  type: 'object',
  additionalProperties: false,
  required: ['budget', 'prioritySpecs', 'os'],
  properties: {
    budget: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['mode', 'tier'],
          properties: {
            mode: { const: 'tier' },
            tier: { enum: ['under-300', '300-600', '600-1000', '1000-plus'] },
          },
        },
        {
          type: 'object',
          additionalProperties: false,
          required: ['mode', 'amount'],
          properties: {
            mode: { const: 'exact' },
            amount: {
              type: 'integer',
              minimum: 50,
              maximum: 3000,
              description: 'Exact USD ceiling; engine adds a 5% price grace band.',
            },
          },
        },
      ],
    },
    prioritySpecs: {
      type: 'object',
      additionalProperties: false,
      description: 'All optional hard requirements; relaxed in order if results run dry.',
      properties: {
        minRamGB: { type: ['integer', 'null'], enum: [4, 6, 8, 12, 16, null] },
        minStorageGB: { type: ['integer', 'null'], enum: [64, 128, 256, 512, null] },
        minBatteryMAh: { type: ['integer', 'null'], enum: [4000, 5000, 6000, 7000, null] },
        minRefreshHz: { type: ['integer', 'null'], enum: [60, 90, 120, 144, null] },
        chipsetPreference: {
          enum: ['any', 'snapdragon', 'apple', 'tensor', 'dimensity', 'exynos'],
        },
        cameraSetup: {
          enum: ['any', 'telephoto', 'ois'],
          description: 'telephoto = optical zoom lens required; ois = stabilised main camera.',
        },
      },
    },
    os: { enum: ['any', 'android', 'ios'] },
  },
};

const fitReasonMax = 400;

export const RECOMMENDATION_SCHEMA = {
  $id: 'phonefit://schemas/recommendation',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Recommendation — one Step-3 card',
  type: 'object',
  additionalProperties: false,
  required: [
    'rank', 'id', 'brand', 'model', 'os', 'estimatedPrice',
    'matchScore', 'primaryFitReason', 'keySpecs', 'pros', 'cons',
  ],
  properties: {
    rank: { type: 'integer', minimum: 1, maximum: 4 },
    id: { type: 'string' },
    brand: { type: 'string' },
    model: { type: 'string' },
    os: { enum: ['iOS', 'Android'] },
    estimatedPrice: {
      type: 'object',
      additionalProperties: false,
      required: ['amountUSD', 'label', 'withinSelectedBudget'],
      properties: {
        amountUSD: { type: 'integer', exclusiveMinimum: 0 },
        label: { type: 'string', pattern: '^≈ \\$' },
        note: { type: ['string', 'null'] },
        withinSelectedBudget: {
          type: 'boolean',
          description: 'false when relaxation stretched prices to reach 3–4 picks.',
        },
      },
    },
    matchScore: {
      type: 'integer', minimum: 0, maximum: 99,
      description: 'Need-weighted composite (0–100) incl. preference bonuses.',
    },
    primaryFitReason: {
      type: 'string', minLength: 20, maxLength: fitReasonMax,
      description: 'Why this phone answers the Step-1 need + honoured Step-2 constraints.',
    },
    keySpecs: {
      type: 'object',
      additionalProperties: false,
      required: ['processor', 'memory', 'display', 'battery', 'cameras'],
      properties: {
        processor: { type: 'string' },
        memory: { type: 'string', description: 'e.g. "12 GB RAM · 256 GB storage"' },
        display: { type: 'string' },
        battery: { type: 'string' },
        cameras: { type: 'string' },
      },
    },
    pros: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    cons: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
  },
};

export const RECOMMENDATION_SET_SCHEMA = {
  $id: 'phonefit://schemas/recommendation-set',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'RecommendationSet — complete Step-3 output',
  type: 'object',
  additionalProperties: false,
  required: ['generatedFor', 'market', 'relaxations', 'count', 'recommendations'],
  properties: {
    generatedFor: {
      type: 'object',
      description: 'Echo of the engine inputs so results are self-describing.',
      required: ['need', 'budget', 'prioritySpecs', 'os'],
      properties: {
        need: STEP_1_INPUT_SCHEMA.properties.need,
        needLabel: { type: 'string' },
        budget: { type: 'object' },
        prioritySpecs: { type: 'object' },
        os: STEP_2_INPUT_SCHEMA.properties.os,
        osLabel: { type: 'string' },
      },
    },
    market: {
      type: 'object',
      required: ['region', 'currency', 'lastVerified'],
      properties: {
        region: { type: 'string' },
        currency: { const: 'USD' },
        lastVerified: { type: 'string' },
      },
    },
    relaxations: {
      type: 'array',
      description: 'Every constraint dropped to reach 3–4 results — always transparent.',
      items: {
        type: 'object',
        required: ['constraint', 'note'],
        properties: {
          constraint: { enum: ['cameraSetup', 'minRefreshHz', 'minBatteryMAh', 'minStorageGB', 'minRamGB', 'budget', 'os'] },
          note: { type: 'string' },
        },
      },
    },
    count: { type: 'integer', minimum: 3, maximum: 4 },
    recommendations: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: RECOMMENDATION_SCHEMA,
    },
  },
};

export const SCHEMAS = {
  step1: STEP_1_INPUT_SCHEMA,
  step2: STEP_2_INPUT_SCHEMA,
  output: RECOMMENDATION_SET_SCHEMA,
};
