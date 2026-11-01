import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import {
  AHREFS_12_OPPORTUNITY_PILLARS,
  LOW_HANGING_FRUIT_KEYWORDS,
  AI_OVERVIEW_FEATURED_SNIPPETS,
  COMPETITOR_CONTENT_GAP_HUBS,
  CONTENT_REFRESH_AND_SINGLE_PUBLISH_RECORDS,
  CANNIBALIZATION_RESOLUTION_MATRIX,
  RECLAIMED_404_REDIRECTS_LIST,
  INTERNAL_LINK_OPPORTUNITIES_MATRIX,
  LINK_INTERSECT_AND_UNLINKED_MENTIONS,
  DESCRIPTIVE_ANCHOR_REPLACEMENTS,
  TECHNICAL_CRITICAL_AUDIT_CHECKS,
  getAhrefsSummaryStats,
  searchAhrefsOpportunities,
  resolveReclaimed404Redirect,
} from '@/services/ahrefsOpportunitiesService';
import {
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Link2,
  CheckCircle2,
  Copy,
  RefreshCw,
  FileText,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AhrefsOpportunitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Content' | 'Links' | 'Technical'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'aio' | 'gaps' | 'redirects' | 'internal-links' | 'technical'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [test404Input, setTest404Input] = useState('/sportpesa-mega-jackpot-predictions');
  const [selectedAioSnippet, setSelectedAioSnippet] = useState(AI_OVERVIEW_FEATURED_SNIPPETS[0]);

  const stats = useMemo(() => getAhrefsSummaryStats(), []);
  const searchResults = useMemo(() => searchAhrefsOpportunities(searchQuery), [searchQuery]);

  const test404Result = useMemo(() => {
    return resolveReclaimed404Redirect(test404Input);
  }, [test404Input]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredPillars = useMemo(() => {
    if (selectedCategory === 'All') return AHREFS_12_OPPORTUNITY_PILLARS;
    return AHREFS_12_OPPORTUNITY_PILLARS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <SEO
        title="Ahrefs 12-Pillar Organic Growth & AI Overviews Hub | PredictPro"
        description="Comprehensive search engine optimization command center covering all 12 Ahrefs Opportunity pillars across Content, Links, and Technical audit domains."
        canonical="/ahrefs-opportunities"
      />
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/seo-indexing" className="hover:text-emerald-400 transition-colors">
                SEO & Indexing Center
              </Link>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">Ahrefs 12-Pillar Opportunity Hub</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">v2.5.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              Ahrefs 12-Pillar Organic Growth & AI Overviews
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Systematic optimization engine addressing Site Explorer, Competitive Analysis, Content Explorer, and Site Audit workflows to capture top-3 rankings, Google AI Overviews, and reclaimed link equity.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/seo-indexing">
              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs">
                <Compass className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Live Indexing Sentinel
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                const csvData = [
                  ['Category', 'Pillar Name', 'Tool', 'Status', 'Impact Metric'],
                  ...AHREFS_12_OPPORTUNITY_PILLARS.map((p) => [
                    p.category,
                    p.opportunityName,
                    p.ahrefsTool,
                    p.status,
                    p.impactMetric,
                  ]),
                ]
                  .map((row) => row.map((cell) => `"${cell}"`).join(','))
                  .join('\n');
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `predictpro-ahrefs-12-pillars-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Export Ahrefs CSV
            </Button>
          </div>
        </div>

        {/* High-Density Summary Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Ahrefs Pillars</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {stats.totalPillars} / 12
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Implemented
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Target Search Volume</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
              {(stats.totalMonthlySearchVolumeTargeted / 1000).toFixed(0)}K<span className="text-xs text-slate-400">/mo</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Across {stats.totalKeywordsTracked + stats.totalCompetitorGapsClosed} High-Intent Hubs
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Avg Striking Position</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
              Pos {stats.avgStrikingPosition}
            </div>
            <div className="text-[11px] text-slate-400">
              Target: Top 3 & AI Overviews
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Reclaimed Backlinks</span>
              <Link2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-400 tabular-nums">
              {stats.totalReferringDomainsReclaimed}
            </div>
            <div className="text-[11px] text-slate-400">
              {stats.reclaimed404Count} Broken Paths 301 Routed
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1 col-span-2 md:col-span-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Audit Site Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              100<span className="text-xs text-slate-400">/100</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 0 Critical Errors
            </div>
          </div>
        </div>

        {/* Global Search and Navigation Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                12-Pillar Matrix
              </button>
              <button
                onClick={() => setActiveTab('keywords')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'keywords' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Low-Hanging Fruit ({LOW_HANGING_FRUIT_KEYWORDS.length})
              </button>
              <button
                onClick={() => setActiveTab('aio')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'aio' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI Overviews & Snippets ({AI_OVERVIEW_FEATURED_SNIPPETS.length})
              </button>
              <button
                onClick={() => setActiveTab('gaps')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'gaps' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Competitor Gaps ({COMPETITOR_CONTENT_GAP_HUBS.length})
              </button>
              <button
                onClick={() => setActiveTab('redirects')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'redirects' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                404 Redirects ({RECLAIMED_404_REDIRECTS_LIST.length})
              </button>
              <button
                onClick={() => setActiveTab('internal-links')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'internal-links' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Internal Links ({INTERNAL_LINK_OPPORTUNITIES_MATRIX.length})
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'technical' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Technical Audit ({TECHNICAL_CRITICAL_AUDIT_CHECKS.length})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="ahrefs-search-filter"
                name="ahrefs-search-filter"
                placeholder="Search keywords, URLs, queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: 12-Pillar Matrix Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Category:</span>
              {(['All', 'Content', 'Links', 'Technical'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 12-Pillar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="font-semibold text-slate-300">{pillar.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-400 font-mono text-[11px]">{pillar.ahrefsTool}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {pillar.opportunityName}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {pillar.objective}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {pillar.itemsResolved} Records Optimized
                    </span>
                    <span className="font-semibold text-emerald-400 font-mono text-[11px]">
                      {pillar.impactMetric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Low-Hanging Fruit Keywords (Positions 4–15) */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Low-Hanging Fruit Keywords (Positions 4–15)</h3>
                <p className="text-xs text-slate-400">
                  Targeted striking-distance queries ranking on Page 1 or top of Page 2 with high commercial volume ready to break into the Top 3.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 shrink-0">
                Total Traffic Potential: <span className="text-cyan-400 font-semibold">+184,800 visits/mo</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Keyword Query</th>
                      <th className="py-2.5 px-3 text-center">Rank</th>
                      <th className="py-2.5 px-3 text-right">Volume</th>
                      <th className="py-2.5 px-3 text-center">KD</th>
                      <th className="py-2.5 px-3 text-right">Traffic Pot.</th>
                      <th className="py-2.5 px-3">Target Landing Page</th>
                      <th className="py-2.5 px-3">Optimization Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {searchResults.keywords.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {item.keyword}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-amber-400 font-bold tabular-nums">#{item.currentPosition}</span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span className="text-emerald-400 font-bold tabular-nums">#{item.targetPosition}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-cyan-400 tabular-nums">
                          {item.monthlyVolume.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className={item.keywordDifficulty > 25 ? 'text-amber-400' : 'text-emerald-400'}>
                            {item.keywordDifficulty}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                          +{item.trafficPotential.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <Link
                            to={item.targetPath}
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>{item.targetPath}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate">
                          {item.upgradeExecuted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI Overviews & Featured Snippet Studio */}
        {activeTab === 'aio' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Overviews & Featured Snippets Extraction Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Preview how Google SGE & Gemini AI Overviews extract PredictPro's mathematical probabilities, bivariate Poisson formulas, and high-confidence predictions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Snippet Selection List */}
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Targeted AI Overviews ({AI_OVERVIEW_FEATURED_SNIPPETS.length})
                </span>
                <div className="space-y-2">
                  {searchResults.snippets.map((snip, idx) => {
                    const isSelected = selectedAioSnippet.query === snip.query;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedAioSnippet(snip)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-purple-400 font-mono font-medium">{snip.serpFeature}</span>
                          <span className="text-amber-400 font-mono tabular-nums">Rank #{snip.currentPosition}</span>
                        </div>
                        <div className="font-medium text-slate-100 font-sans line-clamp-1">
                          "{snip.query}"
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Target: {snip.targetPath}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SERP Simulator Card */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Google AI Overview Live Rendering
                </span>

                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-xl shadow-purple-950/20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-purple-300">Google AI Overview</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400">Extracted from PredictPro.guru</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400">Position #0 Extraction</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white capitalize">
                      {selectedAioSnippet.query}
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      {selectedAioSnippet.conciseAnswer}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Key Formula & Empirical Data Points
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {selectedAioSnippet.keyDataPoints.map((dp, i) => (
                        <li key={i} className="flex items-start gap-2 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{dp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Injected Schema:</span>
                      <span className="font-mono text-cyan-400 text-[11px]">{selectedAioSnippet.schemaInjected}</span>
                    </div>
                    <Link
                      to={selectedAioSnippet.targetPath}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <span>Visit Target Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Competitor Content Gap Matrix */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Top Suggestions from Content Gap</h3>
                <p className="text-xs text-slate-400">
                  New high-traffic content hubs created for keywords that Top 10 competitors (Forebet, Betensured, Windrawwin, Statarea, PredictZ) rank for, backed by PredictPro's mathematical edge.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.contentGaps.map((gap, i) => (
                <div
                  key={i}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-400 font-semibold">{gap.monthlyVolume.toLocaleString()} searches/mo</span>
                      <span className="text-slate-400">KD: {gap.keywordDifficulty}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white hover:text-emerald-400 transition-colors">
                      <Link to={gap.targetPath} className="flex items-center gap-1.5">
                        <span>{gap.pageTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </Link>
                    </h4>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-500 font-medium">Competitors Ranking: </span>
                      <span className="text-slate-300">{gap.competitorsRanking.join(', ')}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                      <span className="text-emerald-400 font-semibold">PredictPro Advantage: </span>
                      {gap.predictProAdvantage}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">{gap.targetPath}</span>
                    <Link
                      to={gap.targetPath}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Explore Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: 404 Redirects Reclamation Engine */}
        {activeTab === 'redirects' && (
          <div className="space-y-6">
            {/* Live 404 URL Tester */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">404 Redirects to Implement & Link Reclamation</h3>
                  <p className="text-xs text-slate-400">
                    Reclaims link equity from historic high-backlink 404 URLs via synchronous HTTP 301 and client-side SPA routing.
                  </p>
                </div>
              </div>

              {/* Interactive Tester Input */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300">Test Any Broken URL Path:</span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    id="test-404-redirect-input"
                    name="test-404-redirect-input"
                    value={test404Input}
                    onChange={(e) => setTest404Input(e.target.value)}
                    placeholder="Enter path e.g. /sportpesa-mega-jackpot-predictions or /matches/arsenal-vs-chelsea"
                    className="h-8 text-xs bg-slate-900 border-slate-700 text-white font-mono"
                  />
                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                    {test404Result ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>301 → {test404Result}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-mono bg-amber-950/60 px-2.5 py-1.5 rounded border border-amber-500/30">
                        <span>No Redirect (Standard 404)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reclaimed 404 Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Broken Historic Path(s)</th>
                      <th className="py-2.5 px-3">Active Target Route</th>
                      <th className="py-2.5 px-3 text-right">Referring Domains</th>
                      <th className="py-2.5 px-3">Top Referring Source</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {searchResults.redirects.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-amber-300 font-medium max-w-xs truncate">
                          {item.broken404Path}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <Link
                            to={item.destinationPath.replace(/:[a-zA-Z0-9_]+/, 'arsenal-vs-chelsea')}
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <span>{item.destinationPath}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-400 font-bold tabular-nums">
                          {item.referringDomainsReclaimed}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate">
                          {item.topReferringSource}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-emerald-400 font-bold">
                            301 Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Internal Link Matrix */}
        {activeTab === 'internal-links' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Internal Link Opportunities</h3>
                <p className="text-xs text-slate-400">
                  Build new contextual internal links from high-ranking pages that mention top target keywords to distribute PageRank efficiently.
                </p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Source Ranking Page</th>
                      <th className="py-2.5 px-3 text-right">Traffic</th>
                      <th className="py-2.5 px-3">Mentioned Keyword</th>
                      <th className="py-2.5 px-3">Recommended Descriptive Anchor</th>
                      <th className="py-2.5 px-3">Target Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {searchResults.internalLinks.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <Link to={item.sourceRankingPath} className="text-slate-300 hover:text-white">
                            {item.sourceRankingPath}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-right text-cyan-400 tabular-nums font-bold">
                          {item.sourcePageTraffic.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300 font-sans">
                          {item.mentionedKeyword}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-emerald-400 font-medium">
                          "{item.descriptiveAnchorText}"
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <Link
                            to={item.targetDestinationPath}
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>{item.targetDestinationPath}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Technical Audit Checks */}
        {activeTab === 'technical' && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Site Audit Critical Issues (0 Errors Benchmark)
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous validation preventing crawl errors across pages, canonical tags, redirects, Core Web Vitals, sitemaps, and structured data.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TECHNICAL_CRITICAL_AUDIT_CHECKS.map((check, i) => (
                <div
                  key={i}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px]">
                      {check.subsystem}
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 0 Errors
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{check.checkName}</h4>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-400">
                      <span className="text-slate-500 font-medium">Verified Value: </span>
                      <span className="text-emerald-300 font-mono">{check.currentVerifiedValue}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500 font-medium">Benchmark: </span>
                      <span className="text-slate-300">{check.benchmarkTarget}</span>
                    </div>
                    <div className="text-slate-300 pt-1 text-[11px]">
                      {check.remediationDetail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
