import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// React 18: act() outside a test renderer needs this flag
global.IS_REACT_ACT_ENVIRONMENT = true;

/** Click through React's real event system (works with createRoot). */
const click = (node) =>
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

it('renders without crashing', () => {
  const div = document.createElement('div');
  const root = createRoot(div);
  act(() => {
    root.render(<App />);
  });
  act(() => {
    root.unmount();
  });
});

it('walks the 3-stage journey: landing → budget modal → tailored results', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  act(() => {
    root.render(<App />);
  });

  // ── Stage 1 · Landing: the purpose prompt is present ─────────────────────
  expect(div.textContent).toContain('What is the primary purpose or main feature');
  const purposeBtn = div.querySelector('#purpose-gaming');
  expect(purposeBtn).not.toBeNull();

  // ── Stage 2 · Modal opens for budget & preferences ───────────────────────
  click(purposeBtn);
  const modal = div.querySelector('[role="dialog"]');
  expect(modal).not.toBeNull();
  expect(modal.textContent).toContain("What's your budget?");
  expect(modal.textContent).toContain('For: Gaming');

  // Submit is disabled until a budget tier is chosen
  const submit = div.querySelector('#submit-preferences');
  expect(submit.disabled).toBe(true);

  click(div.querySelector('#budget-mid'));
  expect(div.querySelector('#submit-preferences').disabled).toBe(false);

  // ── Stage 3 · Results with 3–4 tailored cards ────────────────────────────
  click(div.querySelector('#submit-preferences'));
  expect(div.querySelector('[role="dialog"]')).toBeNull();
  expect(div.textContent).toContain('Tailored for');

  const cards = div.querySelectorAll('article');
  expect(cards.length).toBeGreaterThanOrEqual(3);
  expect(cards.length).toBeLessThanOrEqual(4);
  expect(cards[0].textContent).toContain('% match');
  expect(cards[0].textContent).toContain('Why it fits');
  expect(cards[0].textContent).toContain('Client-listed specs');
  expect(cards[0].textContent).toContain('Customer rating:');

  // Every card shows a localized INR price and client-source details.
  cards.forEach((card) => {
    expect(card.textContent).toMatch(/₹[\d,]+/);
    expect(card.textContent).toContain('Client-listed specs');
  });

  // Browse the complete matching client catalog, not only the four top picks.
  click(div.querySelector('#toggle-catalog-browser'));
  expect(div.querySelector('#catalog-search')).not.toBeNull();
  expect(div.querySelector('#catalog-brand')).not.toBeNull();
  expect(div.querySelector('#catalog-sort')).not.toBeNull();
  expect(div.querySelectorAll('article').length).toBe(12);
  const selectedBrand = div.querySelector('article h3').textContent.split(' ')[0];
  const brandSelect = div.querySelector('#catalog-brand');
  act(() => {
    brandSelect.value = selectedBrand;
    brandSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const brandCards = div.querySelectorAll('article');
  expect(brandCards.length).toBeGreaterThan(0);
  brandCards.forEach((card) => expect(card.querySelector('h3').textContent.startsWith(selectedBrand)).toBe(true));
  click(div.querySelector('#toggle-catalog-browser'));
  expect(div.querySelectorAll('article').length).toBe(4);

  // ── Refine reopens the modal with prior selections kept ──────────────────
  click(div.querySelector('#refine-preferences'));
  const refineModal = div.querySelector('[role="dialog"]');
  expect(refineModal).not.toBeNull();
  expect(refineModal.textContent).toContain('Update my matches');

  // ── Start over returns to the landing stage ──────────────────────────────
  click(div.querySelector('#restart-flow'));
  expect(div.querySelector('#purpose-gaming')).not.toBeNull();

  act(() => {
    root.unmount();
  });
  document.body.removeChild(div);
});
