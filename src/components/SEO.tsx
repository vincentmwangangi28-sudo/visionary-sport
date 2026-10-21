import { Suspense, useEffect } from 'react';
import type {
  SEOBreadcrumbItem,
  SEOManagerOptions,
} from '@/hooks/useSEOManager';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const SEORuntime = lazyWithRetry(() => import('@/components/SEORuntime'));

export type BreadcrumbItem = SEOBreadcrumbItem;
export type SEOProps = SEOManagerOptions;

export const SEO = (props: SEOProps) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (props.title) {
      const candidate = props.title.includes('PredictPro')
        ? props.title
        : props.title.length + 13 <= 60
          ? `${props.title} | PredictPro`
          : props.title;
      if (document.title !== candidate) {
        document.title = candidate;
      }
    }
    if (props.description) {
      const metaDesc = document.head.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content') !== props.description) {
        metaDesc.setAttribute('content', props.description);
      }
    }
  }, [props.title, props.description]);

  return (
    <Suspense fallback={null}>
      <SEORuntime {...props} />
    </Suspense>
  );
};

