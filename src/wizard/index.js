// =============================================================================
//  src/wizard/index.js — public surface of the PhoneFit logic layer
//
//  Pure logic only; zero UI imports. Everything a host app (React, CLI,
//  tests) needs to drive the 3-step wizard is re-exported here.
// =============================================================================

export {
  WIZARD_FLOW,
  NEEDS,
  BUDGET_TIERS,
  EXACT_BUDGET_LIMITS,
  RAM_OPTIONS_GB,
  STORAGE_OPTIONS_GB,
  BATTERY_OPTIONS_MAH,
  REFRESH_OPTIONS_HZ,
  CHIPSET_OPTIONS,
  CAMERA_SETUP_OPTIONS,
  OS_OPTIONS,
  NEED_WEIGHTS,
  RESULTS_MIN,
  RESULTS_MAX,
  isValidNeed,
  isValidTier,
  isValidOS,
} from './config.js';

export { CATALOG_META, PHONE_CATALOG, getPhoneById } from './catalog.js';

export {
  DEFAULT_REQUIREMENTS,
  normalizeRequirements,
  resolveBudgetWindow,
  CONSTRAINT_CHECKS,
  matchedConstraints,
  scorePhone,
  rankCandidates,
  keySpecsOf,
  buildFitReason,
  recommend,
} from './engine.js';

export {
  initialWizardState,
  validateStep1,
  validateStep2,
  canAdvance,
  selectNeed,
  updateRequirements,
  setExactAmount,
  nextStep,
  prevStep,
  refine,
  startOver,
  reducer,
  createWizard,
} from './state.js';

export {
  STEP_1_INPUT_SCHEMA,
  STEP_2_INPUT_SCHEMA,
  RECOMMENDATION_SCHEMA,
  RECOMMENDATION_SET_SCHEMA,
  SCHEMAS,
} from './schemas.js';
