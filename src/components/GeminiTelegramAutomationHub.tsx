import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Layers,
  ShieldCheck,
  Flame,
  Zap,
  Bot,
  MessageSquare,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  analyzeMatchWithGemini,
  curateAccaWithGemini,
  screenValueWithGemini,
  generateTelegramPostWithGemini,
  GeminiMatchAnalysis,
  GeminiAccaResult,
  GeminiValueResult,
} from '@/services/geminiTasksService';
import {
  checkTelegramBotStatus,
  broadcastCustomMessage,
  broadcastBankerBet,
  broadcastAcca,
  TelegramBotStatus,
} from '@/services/telegramTasksService';

export const GeminiTelegramAutomationHub = () => {
  // Bot status state
  const [botStatus, setBotStatus] = useState<TelegramBotStatus | null>(null);
  const [checkingBot, setCheckingBot] = useState(false);
  const [channelInput, setChannelInput] = useState('@predictproAi');

  // Task 1: Banker State
  const [bankerMatch, setBankerMatch] = useState({
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    league: 'Premier League',
    odds: 1.85,
    confidence: 82,
    outcome: 'Home Win',
  });
  const [bankerAnalysis, setBankerAnalysis] = useState<GeminiMatchAnalysis | null>(null);
  const [loadingBankerAi, setLoadingBankerAi] = useState(false);
  const [broadcastingBanker, setBroadcastingBanker] = useState(false);

  // Task 2: Acca State
  const [accaStrategy, setAccaStrategy] = useState<'banker' | 'value' | 'goals'>('banker');
  const [accaResult, setAccaResult] = useState<GeminiAccaResult | null>(null);
  const [loadingAccaAi, setLoadingAccaAi] = useState(false);
  const [broadcastingAcca, setBroadcastingAcca] = useState(false);

  // Task 3: Value Screener State
  const [valueMatch, setValueMatch] = useState({
    home: 'Liverpool',
    away: 'Manchester City',
    bookieHome: 2.35,
    bookieDraw: 3.40,
    bookieAway: 2.90,
  });
  const [valueResult, setValueResult] = useState<GeminiValueResult | null>(null);
  const [loadingValueAi, setLoadingValueAi] = useState(false);

  // Task 4: Custom Broadcast Studio State
  const [customText, setCustomText] = useState(
    `🔥 <b>PREDICTPRO DAILY VIP ALERT</b> 🔥\n\n⚽ <b>Real Madrid vs Barcelona</b>\n🏆 <i>La Liga El Clásico</i>\n🎯 <b>Pick:</b> Both Teams to Score + Over 2.5\n💰 <b>Odds:</b> 1.95\n\n⚡ <i>Powered by Gemini Flash AI</i>\n🔗 https://predictpro.guru`
  );
  const [broadcastingCustom, setBroadcastingCustom] = useState(false);
  const [lastBroadcastPreview, setLastBroadcastPreview] = useState<string | null>(null);

  const handleCheckBot = useCallback(async () => {
    setCheckingBot(true);
    try {
      const res = await checkTelegramBotStatus(channelInput);
      setBotStatus(res);
      if (res.configured) {
        toast.success('Telegram Bot connected successfully!');
      } else {
        toast.info(res.message || 'Telegram Bot is running in preview/simulated mode');
      }
    } catch {
      toast.error('Failed to query Telegram Bot status');
    } finally {
      setCheckingBot(false);
    }
  }, [channelInput]);

  // Check bot on mount
  useEffect(() => {
    handleCheckBot();
  }, [handleCheckBot]);

  // Task 1 Actions
  const handleAnalyzeBanker = async () => {
    setLoadingBankerAi(true);
    try {
      const res = await analyzeMatchWithGemini({
        homeTeam: bankerMatch.home_team,
        awayTeam: bankerMatch.away_team,
        league: bankerMatch.league,
        odds: { home: bankerMatch.odds, draw: 3.4, away: 4.2 },
      });
      setBankerAnalysis(res);
      toast.success('Gemini analysis generated!');
    } catch {
      toast.error('Failed to generate Gemini analysis');
    } finally {
      setLoadingBankerAi(false);
    }
  };

  const handleBroadcastBanker = async () => {
    setBroadcastingBanker(true);
    try {
      const res = await broadcastBankerBet(
        {
          home_team: bankerMatch.home_team,
          away_team: bankerMatch.away_team,
          league: bankerMatch.league,
          predicted_outcome: bankerAnalysis?.outcome_prediction || bankerMatch.outcome,
          odds: bankerMatch.odds,
          confidence_score: bankerAnalysis?.confidence_score || bankerMatch.confidence,
          reasoning: bankerAnalysis?.tactical_breakdown || 'Strong xG differential and home momentum.',
        },
        channelInput
      );

      if (res.success) {
        setLastBroadcastPreview(res.previewText || null);
        toast.success(res.simulated ? 'Banker alert simulated & previewed!' : 'Banker bet posted to Telegram channel!');
      } else {
        toast.error(res.error || 'Failed to broadcast');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error broadcasting');
    } finally {
      setBroadcastingBanker(false);
    }
  };

  // Task 2 Actions
  const handleCurateAcca = async () => {
    setLoadingAccaAi(true);
    try {
      const fixtures = [
        { homeTeam: 'Arsenal', awayTeam: 'Wolves', league: 'Premier League', homeOdds: 1.35 },
        { homeTeam: 'Real Madrid', awayTeam: 'Getafe', league: 'La Liga', homeOdds: 1.45 },
        { homeTeam: 'Bayern Munich', awayTeam: 'Hoffenheim', league: 'Bundesliga', homeOdds: 1.4 },
        { homeTeam: 'PSG', awayTeam: 'Montpellier', league: 'Ligue 1', homeOdds: 1.3 },
      ];
      const res = await curateAccaWithGemini(fixtures, accaStrategy);
      setAccaResult(res);
      toast.success('AI Accumulator slip curated by Gemini!');
    } catch {
      toast.error('Failed to curate accumulator');
    } finally {
      setLoadingAccaAi(false);
    }
  };

  const handleBroadcastAcca = async () => {
    if (!accaResult) return;
    setBroadcastingAcca(true);
    try {
      const res = await broadcastAcca(
        {
          title: accaResult.acca_title,
          totalOdds: accaResult.combined_odds,
          estimatedPayout: Math.round(accaResult.combined_odds * 1000),
          selections: accaResult.legs.map((leg) => ({
            match: leg.match,
            market: leg.market,
            odds: leg.odds,
            confidence: leg.confidence,
          })),
        },
        channelInput
      );

      if (res.success) {
        setLastBroadcastPreview(res.previewText || null);
        toast.success(res.simulated ? 'Acca broadcast simulated & previewed!' : 'Acca slip posted to Telegram channel!');
      } else {
        toast.error(res.error || 'Failed to broadcast acca');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error broadcasting acca');
    } finally {
      setBroadcastingAcca(false);
    }
  };

  // Task 3 Actions
  const handleScreenValue = async () => {
    setLoadingValueAi(true);
    try {
      const res = await screenValueWithGemini(
        { homeTeam: valueMatch.home, awayTeam: valueMatch.away },
        { home: valueMatch.bookieHome, draw: valueMatch.bookieDraw, away: valueMatch.bookieAway },
        { home: 0.52, draw: 0.28, away: 0.2 }
      );
      setValueResult(res);
      toast.success('Market screened with Gemini AI!');
    } catch {
      toast.error('Failed to screen market');
    } finally {
      setLoadingValueAi(false);
    }
  };

  // Task 4 Actions
  const handleGenerateGeminiPost = async () => {
    try {
      const post = await generateTelegramPostWithGemini('custom', {
        match: 'El Clásico',
        odds: 1.95,
        pick: 'BTTS + Over 2.5',
      });
      if (post?.html_post) {
        setCustomText(post.html_post);
        toast.success('Gemini generated fresh Telegram post!');
      }
    } catch {
      toast.error('Failed to generate post');
    }
  };

  const handleSendCustomBroadcast = async () => {
    if (!customText.trim()) return;
    setBroadcastingCustom(true);
    try {
      const res = await broadcastCustomMessage(customText, { channel: channelInput });
      if (res.success) {
        setLastBroadcastPreview(res.previewText || customText);
        toast.success(res.simulated ? 'Broadcast simulated & logged!' : 'Broadcast successfully sent to Telegram!');
      } else {
        toast.error(res.error || 'Failed to broadcast');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error broadcasting');
    } finally {
      setBroadcastingCustom(false);
    }
  };

  return (
    <div id="gemini-telegram-automation-hub" className="space-y-6">
      {/* Top Engine & Bot Header */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Gemini AI & Telegram Task Automation</h2>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    Multi-Task Engine
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Orchestrate Gemini reasoning tasks, +EV value screening, and automated Telegram channel alerts.
                </p>
              </div>
            </div>

            {/* Telegram Channel Target Config & Ping */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2.5 py-1.5 text-xs">
                <Send className="h-3.5 w-3.5 text-sky-500" />
                <span className="text-muted-foreground font-medium">Channel:</span>
                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none w-28 text-foreground"
                  placeholder="@channel"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckBot}
                disabled={checkingBot}
                className="gap-1.5 text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkingBot ? 'animate-spin' : ''}`} />
                {checkingBot ? 'Pinging...' : 'Test Bot'}
              </Button>
            </div>
          </div>

          {/* Bot Connection Pill Indicator */}
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Gemini Model:</span>
              <span className="font-semibold text-foreground">gemini-flash-latest</span>
            </div>

            <div className="flex items-center gap-1.5">
              {botStatus?.configured ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Telegram Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Connected ({botStatus.bot?.first_name || channelInput})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-muted-foreground">Telegram Status:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Preview / Simulated Mode (Channel: {channelInput})
                  </span>
                </>
              )}
            </div>

            <a
              href="https://t.me/predictproAi"
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 hover:underline"
            >
              Open @predictproAi <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Main Task Workflows Tabs */}
      <Tabs defaultValue="banker" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/60">
          <TabsTrigger value="banker" className="py-2.5 gap-2 text-xs md:text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Banker Automation</span>
          </TabsTrigger>
          <TabsTrigger value="acca" className="py-2.5 gap-2 text-xs md:text-sm">
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>AI Acca Curator</span>
          </TabsTrigger>
          <TabsTrigger value="value" className="py-2.5 gap-2 text-xs md:text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Value Bet Screener</span>
          </TabsTrigger>
          <TabsTrigger value="studio" className="py-2.5 gap-2 text-xs md:text-sm">
            <MessageSquare className="h-4 w-4 text-sky-500" />
            <span>Broadcast Studio</span>
          </TabsTrigger>
        </TabsList>

        {/* Task 1: Banker Automation */}
        <TabsContent value="banker" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Task 1: Daily Banker Bet AI Analysis & Broadcast
                  </CardTitle>
                  <CardDescription>
                    Use Gemini to formulate deep tactical validation and auto-dispatch the Banker of the Day to Telegram.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Confidence: {bankerMatch.confidence}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Match Fixture</label>
                  <div className="font-semibold text-sm">
                    {bankerMatch.home_team} vs {bankerMatch.away_team}
                  </div>
                  <div className="text-xs text-muted-foreground">{bankerMatch.league}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Market Pick & Odds</label>
                  <div className="font-semibold text-sm text-primary">{bankerMatch.outcome}</div>
                  <div className="text-xs text-muted-foreground">Odds: {bankerMatch.odds.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyzeBanker}
                    disabled={loadingBankerAi}
                    className="gap-1.5 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {loadingBankerAi ? 'Analyzing...' : 'Gemini Breakdown'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBroadcastBanker}
                    disabled={broadcastingBanker}
                    className="gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {broadcastingBanker ? 'Posting...' : 'Post to Telegram'}
                  </Button>
                </div>
              </div>

              {/* Gemini Analysis Output */}
              {bankerAnalysis && (
                <div className="p-4 rounded-xl border bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Gemini Tactical Insights
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Projected: {bankerAnalysis.projected_score}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">{bankerAnalysis.tactical_breakdown}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">Home Win Prob:</span>
                      <span className="font-bold text-foreground">{bankerAnalysis.home_win_prob}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">BTTS Verdict:</span>
                      <span className="font-bold text-foreground">{bankerAnalysis.btts_verdict}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fair Home Odds:</span>
                      <span className="font-bold text-foreground">{bankerAnalysis.fair_home_odds.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Value Edge:</span>
                      <span className="font-bold text-emerald-600">{bankerAnalysis.expected_value_edge}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task 2: Acca Curator */}
        <TabsContent value="acca" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-500" />
                    Task 2: AI Multi-Match Accumulator Curator
                  </CardTitle>
                  <CardDescription>
                    Gemini analyzes multiple fixtures to construct an optimized accumulator slip and posts it to Telegram.
                  </CardDescription>
                </div>

                {/* Strategy Buttons */}
                <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
                  <Button
                    variant={accaStrategy === 'banker' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAccaStrategy('banker')}
                  >
                    Banker Acca
                  </Button>
                  <Button
                    variant={accaStrategy === 'value' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAccaStrategy('value')}
                  >
                    +EV Value
                  </Button>
                  <Button
                    variant={accaStrategy === 'goals' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAccaStrategy('goals')}
                  >
                    Goals Fest
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCurateAcca}
                  disabled={loadingAccaAi}
                  className="gap-2 text-xs"
                >
                  <Sparkles className="h-4 w-4" />
                  {loadingAccaAi ? 'Evaluating Fixtures...' : 'Curate Acca with Gemini'}
                </Button>

                {accaResult && (
                  <Button
                    variant="outline"
                    onClick={handleBroadcastAcca}
                    disabled={broadcastingAcca}
                    className="gap-2 text-xs text-sky-600 border-sky-300 dark:border-sky-800"
                  >
                    <Send className="h-4 w-4" />
                    {broadcastingAcca ? 'Sending Slip...' : 'Broadcast Slip to Telegram'}
                  </Button>
                )}
              </div>

              {accaResult && (
                <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">{accaResult.acca_title}</h4>
                      <p className="text-xs text-muted-foreground">{accaResult.rationale}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-primary">{accaResult.combined_odds.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{accaResult.combined_confidence}% Conf</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    {accaResult.legs.map((leg, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-background rounded-lg border text-xs">
                        <div>
                          <span className="font-semibold text-foreground">{leg.match}</span>
                          <span className="text-muted-foreground ml-2">({leg.league})</span>
                          <p className="text-muted-foreground text-[11px] mt-0.5">{leg.reason}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {leg.market}
                          </Badge>
                          <span className="font-bold text-foreground">{leg.odds.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task 3: Value Screener */}
        <TabsContent value="value" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Task 3: Expected Value (+EV) Market Screener
              </CardTitle>
              <CardDescription>
                Compare bookmaker pricing against Gemini probability distributions to identify profitable edges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Home Team</label>
                  <Input
                    value={valueMatch.home}
                    onChange={(e) => setValueMatch({ ...valueMatch, home: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Away Team</label>
                  <Input
                    value={valueMatch.away}
                    onChange={(e) => setValueMatch({ ...valueMatch, away: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Bookmaker Home Odds</label>
                  <Input
                    type="number"
                    step="0.05"
                    value={valueMatch.bookieHome}
                    onChange={(e) => setValueMatch({ ...valueMatch, bookieHome: parseFloat(e.target.value) || 2.0 })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={handleScreenValue}
                disabled={loadingValueAi}
                className="gap-2 text-xs"
              >
                <Sparkles className="h-4 w-4 text-primary-foreground" />
                {loadingValueAi ? 'Calculating EV...' : 'Screen with Gemini'}
              </Button>

              {valueResult && (
                <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Edge Detected: {valueResult.verdict}
                    </span>
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-300">
                      +{valueResult.ev_percentage}% EV
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed">{valueResult.analysis}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                    <div>
                      <span className="text-muted-foreground block">Market Price:</span>
                      <span className="font-bold">{valueResult.market_price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fair Fair Price:</span>
                      <span className="font-bold text-emerald-600">{valueResult.fair_price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Kelly Stake:</span>
                      <span className="font-bold text-primary">{valueResult.kelly_stake_percent}% bankroll</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task 4: Broadcast Studio */}
        <TabsContent value="studio" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-sky-500" />
                    Task 4: Telegram Channel Broadcast Studio
                  </CardTitle>
                  <CardDescription>
                    Compose, refine with Gemini, preview, and post rich HTML updates to your Telegram channel.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateGeminiPost}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Auto-Draft with Gemini
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Broadcast Message (HTML Format)</label>
                <Textarea
                  rows={7}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="Type HTML message or use templates..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendCustomBroadcast}
                    disabled={broadcastingCustom || !customText.trim()}
                    className="gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {broadcastingCustom ? 'Broadcasting...' : `Send to ${channelInput}`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(customText);
                      toast.success('Copied text to clipboard');
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Preview bubble */}
              {lastBroadcastPreview && (
                <div className="mt-4 p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="font-semibold text-muted-foreground">Last Broadcast Preview:</div>
                  <pre className="whitespace-pre-wrap font-sans text-xs">{lastBroadcastPreview}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
