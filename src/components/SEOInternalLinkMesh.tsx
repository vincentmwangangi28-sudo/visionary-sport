import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ALL_PAGES_INTEGRATION_CLUSTERS,
  SIMILAR_SITES_KEYWORD_BENCHMARKS,
  getContextualPageIntegration,
  PageIntegrationCluster,
} from '@/services/seoKeywords';
import { getRouteAhrefsOptimizationBundle } from '@/services/ahrefsOpportunitiesService';
import {
  Compass,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  CheckCircle2,
  Link2,
} from 'lucide-react';

export const SEOInternalLinkMesh: React.FC = () => {
  const { pathname } = useLocation();
  const contextual = useMemo(() => getContextualPageIntegration(pathname), [pathname]);
  const ahrefsBundle = useMemo(() => getRouteAhrefsOptimizationBundle(pathname), [pathname]);

  const [selectedClusterId, setSelectedClusterId] = useState<
    PageIntegrationCluster['id'] | 'all'
  >(contextual.activeCluster.id);
  const [showCompetitorMatrix, setShowCompetitorMatrix] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Keep active cluster synced when route changes unless user selected 'all'
  React.useEffect(() => {
    setSelectedClusterId(contextual.activeCluster.id);
  }, [contextual.activeCluster.id]);

  const displayedClusters = useMemo(() => {
    if (selectedClusterId === 'all') {
      return ALL_PAGES_INTEGRATION_CLUSTERS;
    }
    return ALL_PAGES_INTEGRATION_CLUSTERS.filter((c) => c.id === selectedClusterId);
  }, [selectedClusterId]);

  const totalPagesCount = useMemo(
    () => ALL_PAGES_INTEGRATION_CLUSTERS.reduce((acc, c) => acc + c.pages.length, 0),
    []
  );

  const normalizedQuery = filterText.trim().toLowerCase();

  return (
    <section
      aria-label="Related Football Analytics Hubs, Search Keywords & Complete Site Directory"
      className="cv-auto border-t border-border/80 pt-8 mt-4 space-y-6"
    >
      {/* 0. AI Overview & Featured Snippet Answer Box + Freshness & De-Cannibalization Bar */}
      <div
        itemScope
        itemType="https://schema.org/Question"
        data-speakable="true"
        className="rounded-xl border border-emerald-500/25 bg-card p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>AI Overview &amp; Featured Snippet Summary</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Intent: {ahrefsBundle.primarySearchIntent}</span>
          </div>
          <div className="flex items-center gap-2 tabular-nums">
            <time dateTime={ahrefsBundle.lastModifiedIso}>
              Updated {ahrefsBundle.lastModifiedIso}
            </time>
            <span aria-hidden="true">·</span>
            <span>Rev #{ahrefsBundle.revisionNumber}</span>
          </div>
        </div>

        <h3 itemProp="name" className="text-sm sm:text-base font-extrabold text-foreground">
          {ahrefsBundle.aiOverviewQuestion}
        </h3>

        <div
          itemProp="acceptedAnswer"
          itemScope
          itemType="https://schema.org/Answer"
          className="space-y-2"
        >
          <p itemProp="text" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {ahrefsBundle.aiOverviewAnswer}
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            {ahrefsBundle.aiOverviewBullets.map((bullet) => (
              <li
                key={bullet}
                className="text-[11px] font-mono text-foreground bg-muted/40 border border-border/60 rounded-lg px-2.5 py-1.5"
              >
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* High-Traffic Internal Link Opportunities with 100% Descriptive Anchors */}
        <div className="pt-2.5 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-primary inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              <span>Contextual Quantitative Deep Links (Descriptive Topic Anchors)</span>
            </span>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-muted-foreground tabular-nums">
              {ahrefsBundle.strikingDistanceKeywords.map((sk, idx) => (
                <React.Fragment key={sk.keyword}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span>
                    {sk.keyword} (Pos {sk.pos} · {sk.volume})
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ahrefsBundle.contextualInternalLinks.map((lnk) => (
              <Link
                key={lnk.path}
                to={lnk.path}
                title={lnk.descriptiveAnchor}
                className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/70 bg-background hover:border-primary/50 transition-colors text-xs"
              >
                <span className="font-semibold text-foreground group-hover:text-primary line-clamp-1">
                  {lnk.descriptiveAnchor}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Contextual Related Hubs & High-Intent Search Keywords for Active Route */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-bold text-primary">
                <Compass className="h-3.5 w-3.5" />
                <span>Contextual Hub Integration · {contextual.activeCluster.title}</span>
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Benchmarked vs {contextual.activeCluster.competitorBenchmarks.join(' · ')}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1">
              Related Football Predictions, Quantitative Markets &amp; Analytical Tools
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowCompetitorMatrix((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 text-xs font-semibold text-foreground transition-colors self-start lg:self-auto cursor-pointer"
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Similar &amp; Top Sites Keyword Benchmarks</span>
            {showCompetitorMatrix ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Related Sibling Routes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {contextual.relatedPages.map((pg) => (
            <Link
              key={pg.path}
              to={pg.path}
              title={`${pg.label} — ${pg.keywords[0] || 'AI Football Predictions'}`}
              className="group flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs"
            >
              <span className="font-semibold text-foreground group-hover:text-primary truncate">
                {pg.label}
              </span>
              <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>

        {/* Targeted Search Keywords Strip */}
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-foreground mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" /> Indexed Search Topics:
          </span>
          {contextual.competitorKeywords.map((kw, idx) => (
            <React.Fragment key={kw}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <span>{kw}</span>
            </React.Fragment>
          ))}
        </div>

        {/* Expandable Similar & Top Sites Benchmark Matrix */}
        {showCompetitorMatrix && (
          <div className="pt-4 border-t border-border/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                Top Similar Sites SEO &amp; Feature Benchmark Matrix (Forebet · PredictZ · FootyStats · OddsPortal · SofaScore)
              </h4>
              <Link
                to="/sitemap"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full SEO &amp; Sitemap Directory</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SIMILAR_SITES_KEYWORD_BENCHMARKS.map((bench) => (
                <div
                  key={bench.id}
                  className="rounded-lg border border-border/80 bg-card p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-foreground truncate">
                      {bench.domain}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-500 shrink-0">
                      AS {bench.authorityScore} · {bench.monthlyTrafficEstimate}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <strong className="text-foreground">PredictPro Edge:</strong> {bench.predictProEdge}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {bench.integratedRoutes.map((r) => (
                      <Link
                        key={r.path}
                        to={r.path}
                        className="px-2 py-0.5 rounded border border-primary/30 bg-primary/5 text-[10px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {r.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Complete 6-Cluster Full-Site Page Directory (100% Route Integration) */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-foreground">
              Complete PredictPro Page &amp; Market Directory ({totalPagesCount} Integrated Hubs)
            </h3>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                if (e.target.value.trim() && selectedClusterId !== 'all') {
                  setSelectedClusterId('all');
                }
              }}
              placeholder="Filter any page, league, or tool..."
              aria-label="Filter PredictPro pages and keywords"
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Cluster Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {ALL_PAGES_INTEGRATION_CLUSTERS.map((cluster) => {
            const isActive = selectedClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => setSelectedClusterId(cluster.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-border'
                }`}
              >
                {cluster.title.replace(/^\d+\.\s*/, '')} ({cluster.pages.length})
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedClusterId('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedClusterId === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-card text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
            }`}
          >
            View All ({totalPagesCount})
          </button>
        </div>

        {/* Cluster Pages Links */}
        <div className="space-y-4">
          {displayedClusters.map((cluster) => {
            const pages = normalizedQuery
              ? cluster.pages.filter(
                  (p) =>
                    p.label.toLowerCase().includes(normalizedQuery) ||
                    p.path.toLowerCase().includes(normalizedQuery) ||
                    p.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
                )
              : cluster.pages;

            if (pages.length === 0) return null;

            return (
              <div
                key={cluster.id}
                className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-2">
                  <span className="text-xs font-extrabold text-foreground">
                    {cluster.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {cluster.subtitle}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-1.5 text-xs">
                  {pages.map((pg) => {
                    const isCurrent = pathname === pg.path;
                    return (
                      <Link
                        key={pg.path}
                        to={pg.path}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`flex items-center justify-between gap-1 py-1 px-1.5 rounded transition-colors truncate ${
                          isCurrent
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        title={`${pg.label} — Keywords: ${pg.keywords.join(', ')}`}
                      >
                        <span className="truncate">{pg.label}</span>
                        {pg.badge && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                            {pg.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
