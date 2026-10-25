# Real-Time Match Intelligence, Live Standings & Automated Settlement Engine

This release connects the platform end-to-end with ESPN's deep match summary and standings feeds, automated full-time (FT) prediction and bet-slip grading, real-time odds movement (Opening vs. Live/Closing Line Value), and instant goal/red-card match event alerts.

### User Review & Critical Decisions

> [!IMPORTANT]
> All capabilities from the planning review have been included and wired for automated operation across the backend and frontend.

- **Confirmed Decision 1 (All 4 Data & Analytics Pillars)**:
  1. **Deep ESPN Match Summary API**: Real starting XIs, tactical formations, substitutes, H2H history, referee/venue attendance, and play-by-play commentary fetched on demand via `/api/football?type=summary&eventId=...`.
  2. **Real-Time Odds Movement & Line Steam Tracker**: Tracks opening vs. current/closing DraftKings/ESPN moneyline and total lines, calculating implied probability shifts and Closing Line Value (CLV).
  3. **Live Automated Settlement & Verified ROI Ledger**: Background synchronization loop that automatically grades predictions and user parlay/accumulator slips (`Won`, `Lost`, `Push`) as soon as ESPN marks an event `FT` (`state === 'post'`).
  4. **Live League Standings & Top Scorers API Sync**: Connects `/standings` and league hubs directly to ESPN's `/apis/v2/sports/soccer/:league/standings` endpoint for live points, goal differential, and form tables.
- **Confirmed Decision 2 (All 3 UX Anchors Connected)**:
  - **Full Match Detail Drawer** with real lineups, formations, commentary, and team telemetry.
  - **Interactive Multi-Match Parlay & Slip Tracker** with automatic leg-by-leg live grading.
  - **Real-Time Goal & Red Card Audio/Toast Alert Engine** that watches active scoreboards and triggers instant visual/audio notifications when a new goal or red card occurs.
- **Confirmed Decision 3 (Automated FT Settlement + CLV Tracking)**:
  - Automatically settles finished matches from official ESPN full-time scores (`home_score`, `away_score`) while also recording pre-match vs. closing odds for CLV performance auditing.

---

### 1. Overview & Core Concept

- **What It Does**: Eliminates manual grading and static match modals by streaming deep match summaries (lineups, benches, formations, key commentary), live league tables, real-time odds steam, and automated full-time bet settlement directly from official ESPN soccer feeds.
- **Target Audience / Persona**: Football analysts, live in-play bettors, and accumulator builders who need verified starting XIs, real-time goal/card alerts, live odds drift detection, and automatic bankroll/slip settlement without manual data entry.
- **Key Value**: Every match card, live scoreboard row, parlay slip, and league table reflects live stadium truth—automatically grading predictions and slips the moment the final whistle blows.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Deep Match Center Drawer (`/live` & Match Cards)**: Clicking any live, upcoming, or finished match opens the enhanced Match Center Drawer. It fetches the live ESPN Summary for that `eventId` and displays three rich tabs: **Play-by-Play & Commentary**, **Verified Starting XIs & Formations**, and **Team Telemetry & Odds Movement (Opening vs. Live)**.
  2. **Live Goal & Red Card Alert Engine**: While viewing the Live Match Center or In-Play hub, an automatic diff detector compares incoming ESPN scoreboard snapshots every 30 seconds. When a score increments or a new red card event appears in `match_events`, a high-contrast broadcast toast (with optional Web Audio whistle/chime toggle) announces the scorer, minute, and updated scoreline.
  3. **Automated Settlement & CLV Audit (`/performance`, `/track-record`, & Slip Tracker)**: A global auto-settlement hook cross-references saved predictions and active accumulator slips against ESPN's finished (`FT`) scoreboard feed. Completed legs automatically transition from `Pending` to `Won` or `Lost` with actual full-time scores and CLV delta badges.
  4. **Live League Standings (`/standings`)**: Selecting any major European, African, Americas, or Asian competition loads real-time club standings (Played, W-D-L, GF, GA, GD, Points, and 5-match Form) directly from ESPN's standings endpoint.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-density sportsbook & quantitative trading terminal following a 1440px desktop baseline and single-elevation surface hierarchy (`border border-slate-800/80`).
  - *Color Palette & Mood*: 60% deep slate canvas (`#0F172A`), 30% structured data surfaces (`#1E293B`), and 10% semantic status accents—Emerald (`#16A34A`) for verified wins/goals, Amber (`#D97706`) for live in-play clocks and steam alerts, and Crimson (`#DC2626`) for red cards and sharp odds drops.
  - *Typography & Hierarchy*: Crisp display headings paired with strict tabular numerals (`font-mono tabular-nums`) across all odds columns, minute clocks, standings tables, and ROI/CLV ledgers to prevent layout jitter.
  - *Component Styling & Layout*: Compact $36\text{px}$–$44\text{px}$ table rows, clean unboxed metadata separated by typographic dots (`·`), and zero nested card clutter.
- **Interactive Feedback & Motion**:
  - Instant $<200\text{ms}$ tab switches inside the Match Center Drawer, skeleton row placeholders matching exact table geometry while fetching deep summaries, and smooth toast transitions when live goals or automatic bet settlements occur.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: On-Demand Deep Match Summary Endpoint (`/api/football?type=summary&eventId=...`)**
  - *Chosen Approach*: Fetch scoreboard lists in bulk for fast page loads, and query ESPN's `/apis/site/v2/sports/soccer/:league/summary?event=:id` on demand when a user opens a match drawer or detail view.
  - *Why*: Scoreboard endpoints return 100+ matches quickly with scores, odds, and key goal/card events, whereas the summary endpoint returns full 22-player rosters, formations, substitutions, and full commentary without slowing down initial page load.
  - *Alternatives Considered*: Fetching full summaries for all 100+ matches upfront, which would add unnecessary network latency.
- **Decision 2: Client + Server Automated FT Settlement Engine**
  - *Chosen Approach*: Expose finished matches (`state === 'post'`) via `/api/football?type=results` and run an automatic settlement reconciler whenever predictions or user slips load or refresh.
  - *Why*: Ensures every prediction (`Home Win`, `Away Win`, `Draw`, `Over 2.5 Goals`, `Under 2.5 Goals`, `BTTS Yes`) and multi-leg parlay is graded deterministically against official FT scores (`home_score`, `away_score`) with zero manual intervention.
- **Decision 3: Opening vs. Live Odds & CLV Tracking**
  - *Chosen Approach*: Parse both `open` and `close`/`current` moneyline and total lines from ESPN's DraftKings odds payload (`comp.odds[0].moneyline.home.open.odds` vs `close.odds`) to surface real steam movement without requiring a paid historical odds database.
  - *Why*: Provides authentic bookmaker opening-to-current line movement directly from the live ESPN feed.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Express Backend (/api/football)                     │
│  ┌───────────────────┐  ┌───────────────────────┐  ┌────────────────────┐  │
│  │ Scoreboard Engine │  │ Deep Match Summary    │  │ Live Standings API │  │
│  │ (Live/Upcoming/FT)│  │ (Lineups/Formations/  │  │ (Real Tables, GD,  │  │
│  │ + Open/Close Odds │  │  Commentary/H2H/Venue)│  │  Points & Form)    │  │
│  └─────────┬─────────┘  └───────────┬───────────┘  └─────────┬──────────┘  │
└────────────┼────────────────────────┼────────────────────────┼─────────────┘
             │                        │                        │
             ▼                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Client State & Auto-Automation Layer                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ Live Goal/Card Watcher  │  │ Auto-Settlement & CLV Reconciler        │  │
│  │ Diffs live scores/events│  │ Grades Predictions & Parlay Slips vs FT │  │
│  │ -> Fires Audio/Toast    │  │ -> Updates ROI Ledger & Slip Status     │  │
│  └────────────┬────────────┘  └────────────────────┬────────────────────┘  │
└───────────────┼────────────────────────────────────┼───────────────────────┘
                │                                    │
                ▼                                    ▼
┌───────────────────────────┐  ┌──────────────────────────┐  ┌───────────────┐
│ Live Match Center Drawer  │  │ Dropping Odds & Steam    │  │ Live League   │
│ - Starting XIs & Bench    │  │ - Opening vs Live Odds   │  │ Standings Hub │
│ - Tactical Formations     │  │ - Implied Edge & CLV %   │  │ - Real Tables │
│ - Live Key Commentary     │  │ - Auto-Graded Parlay Bar │  │ - Form Streaks│
└───────────────────────────┘  └──────────────────────────┘  └───────────────┘
```

- **Data Model & State**:
  - **MatchSummaryData**: Contains `eventId`, `venue` (name, city, capacity), `referee`, `rosters` (`home` and `away` formation strings, starting 11 with jersey numbers, positions, sub-in/sub-out flags, cards, and bench players), `commentary` (timestamped match commentary items), and `headToHead` (recent official meetings).
  - **OddsMovementData**: Extends match odds with `home_odds_open`, `draw_odds_open`, `away_odds_open`, `odds_movement_direction` (`steam_home`, `steam_away`, `stable`), and `clv_edge_pct`.
  - **AutoSettlementResult**: Evaluates `prediction_type` against official FT `home_score` and `away_score` (`Home Win` $\rightarrow h > a$, `Away Win` $\rightarrow a > h$, `Draw` $\rightarrow h === a$, `Over 2.5 Goals` $\rightarrow h + a > 2.5$, `BTTS Yes` $\rightarrow h > 0 \land a > 0$) and persists `result: 'Won' | 'Lost'`, `actual_score`, and `settled_at`.
- **Interactive Component & State Mapping**:
  - **Match Center Drawer (`LiveScores` & `InPlayPredictionsPage`)**: Clicking a match triggers `useMatchSummary(eventId, leagueCode)`. Switching between *Events & Commentary*, *Lineups & Formations*, and *Stats & Odds Movement* updates the drawer view state immediately.
  - **Live Goal & Card Alert Bar**: Toggle button in the Match Center header enables/mutes real-time goal/red-card audio chimes and displays a dismissible live ticker banner whenever a score or red card changes between polling intervals.
  - **Auto-Settlement Reconciler (`usePredictions`, `TrackRecordPage`, `SlipGeneratorPage`, `DroppingOddsPage`)**: Automatically runs whenever `/api/football?type=live` or `/api/football?type=upcoming` returns finished matches, grading any matching pending predictions or parlay legs and updating the verified ROI counters in real time.
