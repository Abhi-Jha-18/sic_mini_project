
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('PhoneFit App', () => {
  let container;
  let root;

  const click = async (element) => {
    expect(element).not.toBeNull();

    await act(async () => {
      element.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        })
      );
    });
  };

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    window.scrollTo = vi.fn();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }

    container?.remove();
    vi.restoreAllMocks();
  });

  it('renders the landing page', () => {
    expect(container.textContent).toContain(
      'What matters most in your next phone?'
    );

    expect(container.querySelector('#purposes')).not.toBeNull();
    expect(container.querySelector('#hero-start')).not.toBeNull();
  });

  it('opens the budget modal after selecting a purpose', async () => {
    const purposeButton = container.querySelector('[id^="purpose-"]');

    await click(purposeButton);

    const modal = container.querySelector('[role="dialog"]');

    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain("What's your budget?");
    expect(modal.querySelector('[id^="budget-"]')).not.toBeNull();
  });

  it('walks the 3-stage journey: landing → budget modal → tailored results', async () => {
    // Stage 1: Select a purpose.
    const purposeButton = container.querySelector('[id^="purpose-"]');

    expect(purposeButton).not.toBeNull();

    await click(purposeButton);

    // Stage 2: Select a budget.
    const modal = container.querySelector('[role="dialog"]');

    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain("What's your budget?");

    const budgetButton = modal.querySelector('[id^="budget-"]');

    expect(budgetButton).not.toBeNull();

    await click(budgetButton);

    const submitButton = container.querySelector('#submit-preferences');

    expect(submitButton).not.toBeNull();
    expect(submitButton.disabled).toBe(false);

    await click(submitButton);

    // Loading stage should appear first.
    expect(container.textContent).toContain('Scanning 413 phones');

    // Wait for the 1,200 ms results transition.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1400));
    });

    // Stage 3: Results.
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain('Tailored for');

    expect(container.querySelector('#refine-preferences')).not.toBeNull();
    expect(container.querySelector('#restart-flow')).not.toBeNull();
  });
});
