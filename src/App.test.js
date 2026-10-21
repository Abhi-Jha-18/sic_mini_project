import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import App from './App';

const click = (node) => act(() => { Simulate.click(node); });

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('walks the 3-stage journey: landing → budget modal → tailored results', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  act(() => { ReactDOM.render(<App />, div); });

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
  expect(cards[0].textContent).toContain('Pros');
  expect(cards[0].textContent).toContain('Cons');

  // Every card shows a price in ₹
  cards.forEach((card) => expect(card.textContent).toMatch(/₹[\d,]+/));

  // ── Refine reopens the modal with prior selections kept ──────────────────
  click(div.querySelector('#refine-preferences'));
  const refineModal = div.querySelector('[role="dialog"]');
  expect(refineModal).not.toBeNull();
  expect(refineModal.textContent).toContain('Update my matches');

  // ── Start over returns to the landing stage ──────────────────────────────
  click(div.querySelector('#restart-flow'));
  expect(div.querySelector('#purpose-gaming')).not.toBeNull();

  ReactDOM.unmountComponentAtNode(div);
  document.body.removeChild(div);
});
