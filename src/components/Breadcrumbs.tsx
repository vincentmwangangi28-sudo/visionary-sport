import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  getBreadcrumbsForPath,
  generateBreadcrumbJsonLd,
  BreadcrumbCrumb,
} from '@/utils/breadcrumbHierarchy';
import { cn } from '@/lib/utils';

export interface BreadcrumbsProps {
  /** Optional custom breadcrumbs overriding auto-generation */
  items?: BreadcrumbCrumb[];
  /** Optional custom category for blog posts or categorized features */
  category?: string;
  /** Optional override for the current terminal crumb's title */
  currentTitle?: string;
  /** Custom wrapper CSS classes */
  className?: string;
  /** Hide the breadcrumb on home page '/' (default: true) */
  hideOnHome?: boolean;
  /** Whether to inject Schema.org JSON-LD BreadcrumbList in <head> (default: true) */
  injectJsonLd?: boolean;
  /** Base URL for canonical Schema.org item URLs (default: https://predictpro.guru) */
  baseUrl?: string;
  /** Whether to display a miniature Home icon (default: true) */
  showHomeIcon?: boolean;
  /** Custom separator icon or element */
  separator?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  category,
  currentTitle,
  className,
  hideOnHome = true,
  injectJsonLd = true,
  baseUrl = 'https://predictpro.guru',
  showHomeIcon = true,
  separator,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // On home page, optionally hide visual breadcrumb
  if (hideOnHome && (currentPath === '/' || currentPath === '')) {
    return null;
  }

  const crumbs = getBreadcrumbsForPath(currentPath, {
    items,
    category,
    customTitle: currentTitle,
  });

  if (!crumbs || crumbs.length === 0) {
    return null;
  }

  const jsonLd = injectJsonLd ? generateBreadcrumbJsonLd(crumbs, baseUrl) : null;

  return (
    <div className={cn('w-full select-none', className)}>
      {jsonLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        </Helmet>
      )}

      <Breadcrumb aria-label="Breadcrumb">
        <BreadcrumbList
          itemScope
          itemType="https://schema.org/BreadcrumbList"
          className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs text-muted-foreground py-1 px-0.5 overflow-x-auto no-scrollbar"
        >
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            const isHome = idx === 0 && crumb.item === '/';
            const position = idx + 1;
            const fullUrl = crumb.item.startsWith('http')
              ? crumb.item
              : `${baseUrl.replace(/\/+$/, '')}${crumb.item.startsWith('/') ? crumb.item : `/${crumb.item}`}`;

            return (
              <React.Fragment key={`${crumb.item}-${idx}`}>
                <BreadcrumbItem
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                  className="inline-flex items-center gap-1.5"
                >
                  <meta itemProp="position" content={String(position)} />
                  <meta itemProp="name" content={crumb.name} />
                  <link itemProp="item" href={fullUrl} />

                  {isLast ? (
                    <BreadcrumbPage
                      className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[340px]"
                      title={crumb.name}
                    >
                      {crumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        to={crumb.item}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-normal hover:underline underline-offset-4"
                        title={crumb.name}
                      >
                        {isHome && showHomeIcon ? (
                          <>
                            <Home className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="sr-only sm:not-sr-only sm:inline">{crumb.name}</span>
                          </>
                        ) : (
                          crumb.name
                        )}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator className="text-muted-foreground/40">
                    {separator ?? <ChevronRight className="h-3 w-3" />}
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default Breadcrumbs;
