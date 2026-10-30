import { Suspense, useEffect, useState } from 'react';
import type {
  SEOBreadcrumbItem,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const SEORuntime = lazyWithRetry(() => import('@/components/SEORuntime'));

export type BreadcrumbItem = SEOBreadcrumbItem;
export type SEOProps = SEOManagerOptions;

export const SEO = (props: SEOProps) => {
  const [runtimeReady, setRuntimeReady] = useState(
    () => import.meta.env.MODE === 'test'
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (props.title) {
      const candidate = props.title.includes('PredictPro')
        ? props.title
        : props.title.length + 13 <= 60
          ? `${props.title} | PredictPro`
          : props.title;
      const clampedTitle =
        candidate.length <= 60 ? candidate : `${candidate.slice(0, 57).trim()}...`;
      if (document.title !== clampedTitle) {
        document.title = clampedTitle;
      }
    }
    if (props.description) {
      const clampedDesc =
        props.description.length <= 155
          ? props.description
          : `${props.description.slice(0, 152).trim()}...`;
      const metaDesc = document.head.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content') !== clampedDesc) {
        metaDesc.setAttribute('content', clampedDesc);
      }
    }
  }, [props.title, props.description]);

  useEffect(() => {
    if (runtimeReady) return;
    let mounted = false;
    const enable = () => {
      if (mounted) return;
      mounted = true;
      setRuntimeReady(true);
    };
    const timer = setTimeout(enable, 3500);
    window.addEventListener('scroll', enable, { passive: true, once: true });
    window.addEventListener('pointerdown', enable, { passive: true, once: true });
    window.addEventListener('touchstart', enable, { passive: true, once: true });
    return () => {
      clearTimeout(timer);
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

