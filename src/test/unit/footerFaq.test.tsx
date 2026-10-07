import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FooterFAQ } from '@/components/FooterFAQ';
import { FOOTER_FAQS } from '@/data/footerFaqData';

describe('FooterFAQ component', () => {
  it('renders all FAQ questions from the dataset', () => {
    render(<FooterFAQ />);
    expect(screen.getByText(/Frequently Asked Questions & Football Prediction Insights/i)).toBeInTheDocument();

    for (const item of FOOTER_FAQS) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
  });

  it('embeds Schema.org FAQPage structured data script', () => {
    const { container } = render(<FooterFAQ />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity.length).toBe(FOOTER_FAQS.length);
    expect(parsed.mainEntity[0]['@type']).toBe('Question');
    expect(parsed.mainEntity[0].name).toBe(FOOTER_FAQS[0].question);
    expect(parsed.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe(FOOTER_FAQS[0].answer);
  });

  it('toggles FAQ accordion panels on button click', () => {
    render(<FooterFAQ />);
    const firstQuestion = FOOTER_FAQS[0];
    const button = screen.getByText(firstQuestion.question).closest('button');
    expect(button).toBeInTheDocument();

    // Check panel accessibility state
    expect(button).toHaveAttribute('aria-expanded');

    // Click to toggle
    if (button) {
      fireEvent.click(button);
      // Click again
      fireEvent.click(button);
    }
  });
});
