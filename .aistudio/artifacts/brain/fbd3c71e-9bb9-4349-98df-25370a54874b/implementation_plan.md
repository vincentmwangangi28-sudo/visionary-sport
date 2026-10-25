# Real-Time H2H Engine, Live Jackpot Auto-Sync, Player Event Feed & Global Slip Grader

This release connects the remaining four major hubs—Head-to-Head (`H2H`), Mega/Midweek Jackpots, Player Profiles & Scorers, and the Global Floating Bet Slip Drawer—directly to real-time ESPN fixtures, play-by-play scorer events, and automatic full-time settlement.

### User Review & Critical Decisions

> [!IMPORTANT]
> All four platform hubs selected in the planning review will be connected end-to-end with automatic real-time data hydration and fallback-free ESPN prioritization.

- **Confirmed Decision 1 (All 4 Remaining Hubs Connected)**:
  1. **Dynamic H2H Hub (`/h2h`)**: Supports any real club passed via URL query parameters (`?team1=...&team2=...`) or selected from today's live/upcoming ESPN schedule, hydrating real 5-match form (`DLLWD`), season records (`14-4-2`), live DraftKings moneyline odds, and Poisson expected goals.
  2. **Live Jackpot Pool Auto-Sync & 17-Game Live Grader (`/jackpot-predictions` & `/api/jackpots`)**: Automatically populates any missing bookmaker jackpot pools from real upcoming ESPN weekend/midweek fixtures and grades active jackpot legs in real time (`WON`, `LOST`, `LIVE`) against official ESPN scores.
  3. **Real-Time Scorers & Player Prop Sync (`/players` & `/player/:slug`)**: Extracts real goalscorers, penalty takers, and carded players directly from today's and yesterday's ESPN `match_events` (`athletesInvolved`) so the Player Hub highlights players who actually scored in real matches today.
  4. **Global Bet Slip Drawer Live Score & Auto-Grader (`BetSlipDrawer.tsx`)**: Upgrades the site-wide floating Bet Slip drawer so every added selection displays its live score, match minute, CLV edge, and automatic `WON` / `LOST` settlement badge anywhere on the platform.

---

### 1. Overview & Core Concept

- **What It Does**: Unifies the entire application under a single real-time data truth so navigating from a live scoreboard row to H2H comparison, checking a 17-game Mega Jackpot slip, browsing trending goalscorers, or opening the global Bet Slip drawer always reflects live ESPN match events and official full-time scores.
- **Target Audience / Persona**: Football bettors, jackpot syndicate players, and player-prop analysts who want every tool on the site to react dynamically to today's real fixtures and scorers.
- **Key Value**: Zero dead ends or static-only pages—deep links like `/h2h?team1=Newcastle+United&team2=Bournemouth` immediately hydrate real club data, jackpot pools always have 17 verified upcoming fixtures, and the Bet Slip drawer grades selections automatically in real time.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Dynamic H2H Deep-Link & Today's Marquee Switcher (`/h2h`)**: Clicking *"View H2H Trends"* on any match card or scoreboard row opens `/h2h?team1=...&team2=...` and automatically builds a live `TeamProfile` for both clubs using their real ESPN form, season record, logo, and live moneyline odds. A new **"Today's Live & Upcoming Matchups"** quick-selector bar at the top lets users switch between today's real ESPN fixtures in one click.
  2. **Live Jackpot Auto-Sync & 17-Leg Live Score Grader (`/jackpot-predictions`)**: If an external bookmaker feed is off-cycle, `/api/jackpots` automatically synthesizes the 17-game Mega Jackpot and 15-game Midweek pools from real upcoming ESPN fixtures (competitive parity-sorted matches). On the frontend, each of the 17 jackpot rows cross-references live and finished ESPN scores to display live score badges and automatic leg-by-leg `WON`/`LOST` hit counters (e.g., `14/17 Correct`).
  3. **Real-Time Matchday Goalscorers Strip (`/players` & `/player/:slug`)**: Fetches live and recent finished ESPN matches to extract every real player who scored a goal, header, or penalty (`match_events`), displaying a **"Live & Recent Matchday Scorers"** spotlight bar with one-click navigation into their Poisson Player Prop simulator.
  4. **Global Bet Slip Live Grader (`BetSlipDrawer.tsx`)**: Opening the Bet Slip drawer from any page cross-references all selections against `/api/football?type=live` and `/api/football?type=results`, showing real-time scores (`2-1`), clock minutes (`74'` / `FT`), and `WON` / `LOST` settlement badges directly on each slip card.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-density quantitative sportsbook workspace (`1440px` desktop container baseline, single-elevation cards, crisp 1px structural borders).
  - *Color Palette & Mood*: Deep slate neutral surfaces (`#0F172A` / `#1E293B`) with semantic status accents—Emerald (`#16A34A`) for won legs and verified goals, Amber (`#D97706`) for live in-play fixtures, and Crimson (`#DC2626`) for lost legs or red cards.
  - *Typography & Hierarchy*: Tabular monospace numerals (`font-mono tabular-nums`) across all 17 jackpot rows, H2H probability matrices, player xG/90 stats, and Bet Slip odds calculations.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dynamic `TeamProfile` Synthesizer in `H2HComparisonPage.tsx`**
  - *Chosen Approach*: Read `?team1` and `?team2` URL query parameters AND fetch `/api/football?type=upcoming` + `/api/football?type=live`. When a selected team is not in the static 20-club preset list, synthesize a calibrated `TeamProfile` directly from the club's real ESPN form (`home_form`/`away_form`), season record (`home_record`/`away_record`), and live moneyline odds.
  - *Why*: Guarantees that clicking *"View H2H Trends"* on any of the 100+ daily ESPN fixtures across 25+ global leagues works seamlessly with real club telemetry.
- **Decision 2: Real ESPN Fixture Backfill in `jackpotDirectHandler.ts`**
  - *Chosen Approach*: When direct bookmaker scraping returns empty or partial pools, call `fetchServerUpcomingFixtures()` on the server to populate the 17-game Mega Jackpot and 15-game Midweek Jackpot pools with real upcoming ESPN fixtures sorted by tightest draw/competitive parity odds.
  - *Why*: Ensures jackpot pages always display real upcoming matches with authentic kickoff times and odds rather than stale dates.
- **Decision 3: Real-Time Scorer Extraction for Player Hub**
  - *Chosen Approach*: Aggregate `match_events` from `/api/football?type=live` and `/api/football?type=results` to surface real players who scored today/yesterday, and link each scorer directly to `/player/:slug` with their live club and league context.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│                     Express / Edge Backend (/api/*)                        │
│  ┌──────────────────────────┐          ┌────────────────────────────────┐  │
│  │ /api/football            │          │ /api/jackpots                  │  │
│  │ - live / upcoming / FT   │─────────▶│ - Direct Bookmaker Pools       │  │
│  │ - match_events (scorers) │          │ - Auto-Backfill from Real ESPN │  │
│  └────────────┬─────────────┘          └───────────────┬────────────────┘  │
└───────────────┼────────────────────────────────────────┼───────────────────┘
                │                                        │
                ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   Real-Time Frontend Hubs & Global Drawer                  │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐  │
│  │ H2HComparisonPage  │  │ PlayerSearch &     │  │ JackpotPredictions   │  │
│  │ - ?team1 & ?team2  │  │ PlayerProfilePage  │  │ - 17-Game Real Pool  │  │
│  │ - Live Matchup Bar │  │ - Live Scorers Bar │  │ - Live Leg Grader    │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Global BetSlipDrawer (Site-Wide Floating Slip)                       │  │
│  │ - Auto-grades every leg (WON / LOST / LIVE / Pending) with FT scores │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Dynamic H2H Profile**: Maps ESPN fixture data (`home_team`, `away_team`, `home_form`, `away_form`, `home_odds`, `away_odds`, `league`) into `TeamProfile` (`attackRating`, `defenseRating`, `xgForPer90`, `xgAgainstPer90`, `form`).
  - **LiveMatchdayScorer**: Extracted from `RealMatchEvent` (`player`, `teamName`, `league`, `minute`, `detailText`, `matchScore`) and displayed in `PlayerSearch.tsx` and `PlayerProfilePage.tsx`.
  - **Global Slip Live Map**: `BetSlipDrawer.tsx` polls live/finished ESPN matches and calls `gradeSelectionAgainstFeed()` for each `BetSelection` in `useBetSlip()`.
- **Interactive Component & State Mapping**:
  - **`H2HComparisonPage.tsx`**: Reads `useSearchParams()` for `team1` and `team2` on mount, populates a **"Today's Real Matchups"** selector strip from live/upcoming ESPN fixtures, and recalculates Bivariate Poisson win/draw/over probabilities immediately on click.
  - **`jackpotDirectHandler.ts` & `JackpotPredictions.tsx`**: Ensures all 5 jackpot pools (`sportpesa`, `sportpesa_midweek`, `betika`, `betika_grand`, `mozzart`) are populated with real upcoming ESPN fixtures and grades any live/finished legs automatically.
  - **`PlayerSearch.tsx` & `PlayerProfilePage.tsx`**: Renders a **"Today's Verified Matchday Goalscorers (ESPN Live Feed)"** strip and enriches custom player slugs with real match event records when available.
  - **`BetSlipDrawer.tsx`**: Displays live score badges (`LIVE 64' · 2-1` or `FT · WON`) and summary settlement counts (`X Won · Y Live · Z Pending`) at the top of the drawer.
