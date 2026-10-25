// =============================================================================
//  scripts/demo.mjs — PhoneFit logic layer, end-to-end demo
//
//  Runs the 3-step wizard machine for three personas and prints the exact
//  structured Step-3 output a UI would render. No browser needed:
//
//      node scripts/demo.mjs
// =============================================================================

import {
  createWizard,
  nextStep,
  selectNeed,
  updateRequirements,
  setExactAmount,
  normalizeRequirements,
} from '../src/wizard/index.js';

const run = (title, actions) => {
  const w = createWizard();
  actions.forEach((a) => w.dispatch(a));
  const { step, inputs, output, validation } = w.getState();

  console.log('═'.repeat(78));
  console.log(`▸ SCENARIO — ${title}`);
  console.log('─'.repeat(78));
  console.log(`  step reached: ${step}   need: ${inputs.need}   validation errors: ${JSON.stringify(validation)}`);
  console.log(
    `  budget: ${output.generatedFor.budget.windowLabel}   os: ${output.generatedFor.osLabel}` +
      `   market: ${output.market.region} (${output.market.currency}, verified ${output.market.lastVerified})`,
  );
  if (output.relaxations.length) {
    console.log('  relaxations:');
    output.relaxations.forEach((r) => console.log(`    • [${r.constraint}] ${r.note}`));
  }
  console.log('');
  output.recommendations.forEach((r) => {
    console.log(`  #${r.rank}  ${r.brand} ${r.model}  (${r.os})  —  match ${r.matchScore}/99`);
    console.log(`      price:  ${r.estimatedPrice.label}${r.estimatedPrice.withinSelectedBudget ? '' : '  ⚠ outside selected range'}`);
    console.log(`      fit:    ${r.primaryFitReason}`);
    console.log(`      specs:  ${r.keySpecs.processor} | ${r.keySpecs.memory}`);
    console.log(`              ${r.keySpecs.display} | ${r.keySpecs.battery}`);
    console.log(`              ${r.keySpecs.cameras}`);
    console.log(`      pros:   ${r.pros.join('  /  ')}`);
    console.log(`      cons:   ${r.cons.join('  /  ')}`);
    console.log('');
  });
  return output;
};

// ── Persona 1: mobile photographer, flagships welcome ──────────────────────
const camera = run('Camera-first buyer, $1,000+ tier, no OS preference', [
  selectNeed('camera'),
  nextStep(),
  updateRequirements(normalizeRequirements({
    budget: { mode: 'tier', tier: '1000-plus' },
    prioritySpecs: { cameraSetup: 'telephoto' },
  })),
  nextStep(),
]);

// ── Persona 2: competitive gamer with a hard $800 ceiling ──────────────────
run('Competitive gamer, exact $800, Snapdragon preference, 12 GB RAM', [
  selectNeed('gaming'),
  nextStep(),
  updateRequirements(normalizeRequirements({
    prioritySpecs: { minRamGB: 12, minRefreshHz: 144, chipsetPreference: 'snapdragon' },
  })),
  setExactAmount(800),
  nextStep(),
]);

// ── Persona 3: battery-obsessed iOS user on a tight budget ─────────────────
// (forces the engine's transparent budget-relaxation path)
const battery = run('Battery-first, iOS preferred, Under $300 (relaxation demo)', [
  selectNeed('battery'),
  nextStep(),
  updateRequirements(normalizeRequirements({
    budget: { mode: 'tier', tier: 'under-300' },
    prioritySpecs: { minBatteryMAh: 4000 },
    os: 'ios',
  })),
  nextStep(),
]);

// Full structured payload sample — exactly what Step 3 hands to the UI layer.
console.log('═'.repeat(78));
console.log('▸ RAW STEP-3 PAYLOAD (scenario 1, truncated to the #1 pick):');
console.log(JSON.stringify(
  { ...camera, recommendations: camera.recommendations.slice(0, 1) },
  null,
  2,
));
console.log('═'.repeat(78));
console.log(`Relaxation keys across scenarios: camera=${camera.relaxations.length}, battery=${battery.relaxations.length}`);
