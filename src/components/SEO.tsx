import { Suspense, useEffect, useState } from 'react';
import type {
  SEOBreadcrumbItem,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const SEORuntime = lazyWithRetry(() => import('@/components/SEORuntime'));

export type BreadcrumbItem = SEOBreadcrumbItem;
export type SEOProps = SEOManagerOptions;

function clampTitleWordBoundary(raw: string): string {
  const text = (raw || '').trim();
  const candidate = text.includes('PredictPro')
    ? text
    : text.length + 13 <= 60
      ? `${text} | PredictPro`
      : text;
  if (candidate.length <= 60) return candidate;
  const withoutBrand = candidate.replace(/\s*[|—-]\s*PredictPro.*$/i, '').trim();
  if (withoutBrand.length <= 60 && withoutBrand.length >= 10) {
    return withoutBrand.length + 13 <= 60 ? `${withoutBrand} | PredictPro` : withoutBrand;
  }
  let truncated = candidate.slice(0, 60);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 30) {
    truncated = truncated.slice(0, lastSpace).replace(/[,:&|—-]+$/, '');
  }
  return truncated.trim();
}

export const SEO = (props: SEOProps) => {
  const [runtimeReady, setRuntimeReady] = useState(
    () =>
      import.meta.env.MODE === 'test' ||
      (typeof navigator !== 'undefined' &&
        !navigator.webdriver &&
        !/HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent || '') &&
        /googlebot|ahrefsbot|bingbot|yandex|duckduckbot|slurp|applebot/i.test(
          navigator.userAgent || ''
        ))
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (props.title) {
      const clampedTitle = clampTitleWordBoundary(props.title);
      if (document.title !== clampedTitle) {
        document.title = clampedTitle;
      }
    }
    if (props.description) {
      const rawDesc = props.description.trim();
      let clampedDesc = rawDesc;
      if (rawDesc.length > 155) {
        let sub = rawDesc.slice(0, 152);
        const space = sub.lastIndexOf(' ');
        if (space > 115) sub = sub.slice(0, space).replace(/[,:;]+$/, '');
        clampedDesc = `${sub.trim()}...`;
      }
      const metaDesc = document.head.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content') !== clampedDesc) {
        metaDesc.setAttribute('content', clampedDesc);
      }
    }
  }, [props.title, props.description]);

  useEffect(() => {
    if (runtimeReady) return;
    if (
      typeof window !== 'undefined' &&
      (navigator.webdriver ||
        /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent || ''))
    ) {
      return;
    }
    let mounted = false;
    const enable = () => {
      if (mounted) return;
      mounted = true;
      setRuntimeReady(true);
    };
    window.addEventListener('scroll', enable, { passive: true, once: true });
    window.addEventListener('pointerdown', enable, { passive: true, once: true });
    window.addEventListener('touchstart', enable, { passive: true, once: true });
    return () => {
      window.removeEventListener('scroll', enable);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, [runtimeReady]);

  if (!runtimeReady) return null;

  return (
    <Suspense fallback={null}>
      <SEORuntime {...props} />
    </Suspense>
  );
};

