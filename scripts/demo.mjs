import {
  getRecommendations,
  purposeMeta,
} from '../src/data/mockDatabase.js';

const scenarios = [
  { title: 'Camera-first buyer · ₹20,000–₹50,000', purpose: 'camera', budget: 'mid', size: 'any' },
  { title: 'Battery-focused buyer · under ₹20,000', purpose: 'battery', budget: 'entry', size: 'any' },
  { title: 'Large-screen media buyer · above ₹50,000', purpose: 'media', budget: 'flagship', size: 'large' },
];

for (const scenario of scenarios) {
  const { list, relaxed } = getRecommendations(scenario);
  console.log(`\n${'='.repeat(76)}`);
  console.log(`SCENARIO — ${scenario.title}`);
  console.log(`Purpose: ${purposeMeta(scenario.purpose).label} · Matches: ${list.length}`);
  if (relaxed.length) console.log(`Relaxed preferences: ${relaxed.join(', ')}`);

  list.forEach(({ phone, match }, index) => {
    console.log(`\n#${index + 1} ${phone.name} — ${match}% match`);
    console.log(`   Price: ₹${phone.priceINR.toLocaleString('en-IN')} · Rating: ${phone.rating}/5`);
    console.log(`   Camera: ${phone.cameraMP || 'not listed'} MP · Display: ${phone.screenInches}" ${phone.displayType}`);
    console.log(`   Battery: ${phone.batteryMah.toLocaleString()} mAh · ${phone.ramGB} GB RAM · ${phone.storageGB} GB storage`);
    console.log(`   Processor: ${phone.processor || 'not listed'}`);
  });
}
