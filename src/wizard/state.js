// =============================================================================
//  src/wizard/state.js — PhoneFit wizard · state machine & step logic
//
//  A framework-agnostic state machine. The whole UI story of the wizard is:
//
//     ┌─────────┐  SELECT_NEED + NEXT   ┌─────────┐  UPDATE_REQUIREMENTS
//     │ STEP 1  │ ────────────────────▶ │ STEP 2  │ ───────────────┐
//     │  need   │ ◀──── BACK ────────── │ budget, │                ▼
//     └─────────┘                       │ specs,  │      NEXT (validate & run
//            ▲                          │ os      │      the engine)
//            │ START_OVER               └────┬────┘                │
//            │                               │ REFINE (edit inputs)│
//            └────────────────────────────────┘◀─────── ┌──────────▼───┐
//                                                       │    STEP 3    │
//                                                       │  output cards│
//                                                       └──────────────┘
//
//  `reducer` + `initialWizardState` are pure — drop into useReducer, Redux,
//  a test, or the tiny framework-free `createWizard` store included here.
// =============================================================================

import {
  BUDGET_TIERS,
  EXACT_BUDGET_LIMITS,
  isValidNeed,
  isValidOS,
  isValidTier,
  CHIPSET_OPTIONS,
  CAMERA_SETUP_OPTIONS,
} from './config.js';
import { DEFAULT_REQUIREMENTS, recommend } from './engine.js';

export const initialWizardState = Object.freeze({
  step: 1, // 1 | 2 | 3 — see WIZARD_FLOW in config.js
  inputs: {
    need: null, // one of NEEDS[].key       (Step 1)
    requirements: DEFAULT_REQUIREMENTS, // budget / specs / os (Step 2)
  },
  validation: {}, // { field: 'human readable error' } for the current step
  output: null, // RecommendationSet once Step 3 is reached
});

// ─────────────────────────────── validators ────────────────────────────────

export function validateStep1(need) {
  const errors = {};
  if (!need) errors.need = 'Pick the one thing your next phone must be great at.';
  else if (!isValidNeed(need)) errors.need = `Unknown need "${need}".`;
  return errors;
}

export function validateStep2(requirements) {
  const r = requirements || {};
  const b = r.budget || {};
  const s = r.prioritySpecs || {};
  const errors = {};

  if (b.mode === 'exact') {
    const amt = +b.amount;
    if (!Number.isFinite(amt) || amt < EXACT_BUDGET_LIMITS.min || amt > EXACT_BUDGET_LIMITS.max)
      errors.budgetAmount = `Enter an exact budget between $${EXACT_BUDGET_LIMITS.min} and $${EXACT_BUDGET_LIMITS.max}.`;
  } else if (!isValidTier(b.tier)) {
    errors.budgetTier = `Choose a price range: ${BUDGET_TIERS.map((t) => t.label).join(' / ')}.`;
  }

  if (!isValidOS(r.os ?? 'any')) errors.os = 'Choose iOS, Android, or No preference.';

  const range = (v, min, max) => v == null || (Number.isFinite(+v) && +v >= min && +v <= max);
  if (!range(s.minRamGB, 2, 24)) errors.minRamGB = 'Minimum RAM must be 4–24 GB.';
  if (!range(s.minStorageGB, 32, 2048)) errors.minStorageGB = 'Storage floor must be 64 GB – 2 TB.';
  if (!range(s.minBatteryMAh, 2000, 8000)) errors.minBatteryMAh = 'Battery floor must be 2,000–8,000 mAh.';
  if (!range(s.minRefreshHz, 60, 240)) errors.minRefreshHz = 'Refresh rate floor must be 60–240 Hz.';
  if (s.chipsetPreference && !CHIPSET_OPTIONS.some((c) => c.key === s.chipsetPreference))
    errors.chipsetPreference = 'Unknown chipset preference.';
  if (s.cameraSetup && !CAMERA_SETUP_OPTIONS.some((c) => c.key === s.cameraSetup))
    errors.cameraSetup = 'Unknown camera-setup requirement.';

  return errors;
}

export const isEmpty = (obj) => Object.keys(obj).length === 0;

/** Can the user move forward from the step they're on? */
export function canAdvance(state) {
  if (state.step === 1) return isEmpty(validateStep1(state.inputs.need));
  if (state.step === 2) return isEmpty(validateStep2(state.inputs.requirements));
  return false; // Step 3 is terminal — REFINE or START_OVER instead
}

// ───────────────────────────── action creators ─────────────────────────────

export const selectNeed = (need) => ({ type: 'SELECT_NEED', need });
export const updateRequirements = (patch) => ({ type: 'UPDATE_REQUIREMENTS', patch });
export const setExactAmount = (amount) => ({
  type: 'UPDATE_REQUIREMENTS',
  patch: { budget: { mode: 'exact', amount } },
});
export const nextStep = () => ({ type: 'NEXT' });
export const prevStep = () => ({ type: 'BACK' });
export const refine = () => ({ type: 'REFINE' });
export const startOver = () => ({ type: 'START_OVER' });

// ───────────────────────────────── reducer ─────────────────────────────────

const deepMergeReq = (req, patch = {}) => ({
  budget: { ...req.budget, ...(patch.budget || {}) },
  prioritySpecs: { ...req.prioritySpecs, ...(patch.prioritySpecs || {}) },
  os: patch.os ?? req.os,
});

export function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_NEED': {
      const requirements =
        action.need === 'gaming'
          ? // Gaming is the one need where a sensible default spec floor
            // improves recommendations out of the box — pre-fill, still editable.
            {
              ...state.inputs.requirements,
              prioritySpecs: { ...state.inputs.requirements.prioritySpecs, minRamGB: 8, minRefreshHz: 120 },
            }
          : state.inputs.requirements;
      return {
        ...state,
        inputs: { need: action.need, requirements },
        validation: {},
        output: null, // any upstream change invalidates old results
      };
    }

    case 'UPDATE_REQUIREMENTS':
      return {
        ...state,
        inputs: { ...state.inputs, requirements: deepMergeReq(state.inputs.requirements, action.patch) },
        output: null, // stale results must never survive an input change
      };

    case 'NEXT': {
      if (state.step === 1) {
        const validation = validateStep1(state.inputs.need);
        return isEmpty(validation) ? { ...state, step: 2, validation } : { ...state, validation };
      }
      if (state.step === 2) {
        const validation = validateStep2(state.inputs.requirements);
        if (!isEmpty(validation)) return { ...state, validation };
        // Inputs are valid → run the engine once and cache the result set.
        const output = recommend({
          need: state.inputs.need,
          requirements: state.inputs.requirements,
        });
        return { ...state, step: 3, validation: {}, output };
      }
      return state;
    }

    case 'BACK':
      return state.step > 1 ? { ...state, step: state.step - 1, validation: {} } : state;

    case 'REFINE': // Step-3 → Step-2, inputs preserved, output kept for diffing
      return state.step === 3 ? { ...state, step: 2, validation: {} } : state;

    case 'START_OVER':
      return structuredClone
        ? structuredClone(initialWizardState)
        : JSON.parse(JSON.stringify(initialWizardState));

    default:
      return state;
  }
}

// ─────────────────── tiny framework-free store (optional) ──────────────────

/**
 * createWizard() — the same state machine wrapped in a ~20-line observable
 * store, for demos/tests or non-React hosts. React apps should just use
 * useReducer(reducer, initialWizardState) with the action creators above.
 */
export function createWizard() {
  let state = { ...initialWizardState, inputs: { ...initialWizardState.inputs,
    requirements: JSON.parse(JSON.stringify(DEFAULT_REQUIREMENTS)) } };
  const listeners = new Set();
  return {
    getState: () => state,
    dispatch(action) {
      state = reducer(state, action);
      listeners.forEach((fn) => fn(state));
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
