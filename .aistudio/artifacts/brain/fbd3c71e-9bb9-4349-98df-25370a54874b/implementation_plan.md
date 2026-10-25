# Phase 4 Implementation Plan: Real-Time Standings, Sharp Money CLV, Official Referee Telemetry & Accumulator Live Settlement

## 1. Executive Summary
Phase 4 connects the remaining statistical, market-movement, officiating, and accumulator hubs directly to our real-time ESPN endpoints (`/api/football?type=live`, `upcoming`, `results`, `standings`, and `summary`) and our automated market settlement engine (`evaluateMarketOutcome`):

1. **Live In-Play Standings & 20-League ESPN Table Sync (`/standings`)**:
   - Expand `LEAGUES` in `src/data/standingsData.ts` so all 20+ global leagues supported by our backend `/api/football?type=standings` endpoint are selectable in the UI.
   - Connect `src/pages/Standings.tsx` to `fetchLiveMatches()` so when `"Live In-Play Table"` (`live_inplay`) mode is active, any team currently playing in a live ESPN match has its live scoreline (`home_score` vs `away_score`) applied to its projected points, goal difference, and live rank movement (`liveRankDelta`), alongside a live score badge in the table row.
2. **Sharp Money Splits & RLM Radar Synced to ESPN DraftKings CLV (`/sharp-money-splits`)**:
   - Connect `src/pages/SharpMoneySplitsPage.tsx` to `fetchLiveMatches()` and `fetchRealtimeUpcomingFixtures()`.
   - Transform fixtures with real ESPN DraftKings `oddsMovement` (`openHome`, `closeHome`, `openAway`, `closeAway`, `clvEdgePct`) into live `SharpSplitFixture` cards with calculated ticket-vs-money handle splits, `SYNDICATE STEAM` / `RLM TRAP ALERT` badges, and a manual refresh button.
3. **Referee Discipline & Cards Hub Synced to Official ESPN Match Officials (`/referee-stats`)**:
   - Connect `src/pages/RefereeStatsPredictions.tsx` to today's live and upcoming ESPN fixtures and `fetchDeepMatchSummary(eventId)`.
   - Add a **"Today's Official ESPN Match Officials & Live Card Telemetry"** bar where selecting an active or upcoming ESPN fixture loads the official assigned referee (`gameInfo.officials`), venue, attendance, live yellow/red card counts, and fouls, and syncs the referee's strictness parameters directly into the interactive Match Card & Foul Simulator.
4. **Accumulator Builder & Smart Slip Generator Live Leg Settlement (`/accumulator` & `/slip-generator`)**:
   - Embed `<LiveParlaySettlementBar />` inside `src/pages/AccumulatorBuilder.tsx` and `src/pages/SlipGeneratorPage.tsx`.
   - Grade each selection in the active slip against live (`fetchLiveMatches`) and 48-hour finished (`fetchOfficialFinishedResults`) ESPN scores using `evaluateMarketOutcome`, showing `LIVE`, `WON`, or `LOST` badges per leg and providing a **"Prune Settled / Losing Legs"** button to keep active accumulators ready to book.

---

## 2. File-by-File Technical Plan

### A. Live In-Play Standings & 20-League ESPN Table Sync
- **`src/data/standingsData.ts`**:
  - Add league configurations and fallback tables for the expanded ESPN leagues supported by `footballHandler.ts` (including UEFA Champions League, Europa League, Championship, Scottish Premiership, Belgian Pro League, Turkish Süper Lig, Greek Super League, Liga MX, Argentine Primera, CAF Champions League, South African PSL, and Saudi Pro League).
- **`src/pages/Standings.tsx`**:
  - Fetch active live matches via `fetchLiveMatches()` on mount and poll every 60 seconds.
  - Pass `liveMatches` into `computeEnrichedStandings(rows, venueSplit, tableMode, liveMatches)` so teams currently playing have real in-play points (`+3` if leading, `+1` if drawing, `+0` if trailing) and live goal difference deltas calculated from actual ESPN scores, sorting the table by `liveProjectedPts` when `tableMode === 'live_inplay'` and displaying a live match pill (`LIVE 64' · 2-1`) next to the team name.

### B. Sharp Money Splits & RLM Radar Synced to ESPN DraftKings CLV
- **`src/pages/SharpMoneySplitsPage.tsx`**:
  - Fetch live and upcoming ESPN fixtures (`fetchLiveMatches()` and `fetchRealtimeUpcomingFixtures()`) and inspect `odds_movement` (`openHome`, `closeHome`, `openAway`, `closeAway`, `clvEdgePct`).
  - Prepend real ESPN DraftKings line-movement fixtures ahead of the baseline curated fixtures, classifying steam drops (`openingSharpOdds > currentSharpOdds`) into `RLM TRAP ALERT`, `SYNDICATE STEAM`, or `CONTRA VALUE`, with an `"ESPN DraftKings CLV Verified"` badge.

### C. Referee Discipline Hub Synced to Official ESPN Match Officials
- **`src/pages/RefereeStatsPredictions.tsx`**:
  - Fetch live and upcoming ESPN matches with `espnEventId` and allow clicking any match to load `fetchDeepMatchSummary(eventId)`.
  - Display the official referee name (`summary.officials`), venue, attendance, and real-time yellow/red card & foul counts from ESPN telemetry, with a one-click **"Load into Card Simulator"** action that calibrates the interactive referee card & foul expectancy model.

### D. Accumulator Builder & Slip Generator Live Leg Settlement
- **`src/pages/AccumulatorBuilder.tsx` & `src/pages/SlipGeneratorPage.tsx`**:
  - Render `<LiveParlaySettlementBar />` in the accumulator slip column so users immediately see live leg scores, `WON` / `LOST` / `LIVE` badges, and settled payout status.
  - Add a **"Remove Settled / Lost Legs"** utility button when any leg in the slip has already finished or lost, allowing one-click cleanup before generating a regional booking code.

---

## 3. Verification Criteria
- Run `lint_applet` and `compile_applet` with zero TypeScript or build errors.
- Verify that `/standings`, `/sharp-money-splits`, `/referee-stats`, `/accumulator`, and `/slip-generator` seamlessly degrade to baseline data if an external feed is temporarily unreachable.
