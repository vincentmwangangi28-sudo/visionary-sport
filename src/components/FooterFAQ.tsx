import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { FOOTER_FAQS } from '@/data/footerFaqData';

export const FooterFAQ: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]);

  const toggleItem = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FOOTER_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section
      aria-labelledby="footer-faq-heading"
      className="border-t border-border/70 pt-8 pb-10 my-4"
    >
      {/* Schema.org FAQPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="footer-faq-heading"
              className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2"
            >
              Frequently Asked Questions &amp; Football Prediction Insights
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Schema.org FAQPage
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Mathematical modeling, Expected Goals (xG) statistics, and algorithmic banker picks explained
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setOpenIndices(
              openIndices.length === FOOTER_FAQS.length
                ? []
                : FOOTER_FAQS.map((_, i) => i)
            )
          }
          className="text-xs text-primary hover:underline font-semibold"
        >
          {openIndices.length === FOOTER_FAQS.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {FOOTER_FAQS.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          const panelId = `footer-faq-panel-${idx}`;
          const buttonId = `footer-faq-button-${idx}`;

          return (
            <div
              key={item.question}
              className="rounded-xl border border-border/70 bg-card/60 hover:bg-card transition-colors p-3.5 sm:p-4 text-xs"
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(idx)}
                className="w-full flex items-start justify-between gap-3 text-left font-semibold text-foreground group cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="mt-2.5 pt-2.5 border-t border-border/40 text-muted-foreground leading-relaxed text-xs"
                >
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FooterFAQ;
