import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

export const LazyImage = ({
  src,
  alt,
  className,
  placeholderClassName,
  width,
  height,
  loading = 'lazy'
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Generate WebP srcset if possible
  const getOptimizedSrc = (originalSrc: string) => {
    // If it's already a WebP or external URL, return as is
    if (originalSrc.includes('.webp') || originalSrc.startsWith('http')) {
      return originalSrc;
    }
    return originalSrc;
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        !isLoaded && 'bg-muted animate-pulse',
        placeholderClassName
      )}
      style={{ width, height }}
    >
      {isInView && (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}
      
      {/* Low-quality placeholder */}
      {!isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-muted to-muted/50',
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default LazyImage;
