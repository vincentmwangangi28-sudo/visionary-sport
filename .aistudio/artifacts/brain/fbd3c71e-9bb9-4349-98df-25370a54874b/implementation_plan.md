# PredictPro (`predictpro.guru`) — Phase 11 Master Plan: Live In-Play Edge, Social Story Studio, Tournament Group Predictor & Auto-Settled ROI Ledger

Phase 11 expands PredictPro's 100% free-access quantitative sports analytics platform with four high-retention, viral distribution, and live matchday intelligence pillars—engineered with zero paywalls or subscription gates.

## User Review & Critical Decisions

> [!IMPORTANT]
> **100% Free-Access Quantitative Commitment**: Every tool in Phase 11 is unlocked by default for all visitors and members. Below are the confirmed defaults for the four pillars—click **Proceed** to build all four, or let me know if you want to adjust any pillar.

- **Confirmed Decision 1 (Four Flagship Pillars)**: Deliver all four Phase 11 pillars:
  1. **In-Play Live Edge & Late-Goal (75'+) Momentum Radar** (`/in-play-edge`)
  2. **Automated Social Graphic & WhatsApp Story Card Studio** (`/social-card-studio` + Admin integration)
  3. **Interactive Group-Stage & Knockout Tournament Predictor** (`/tournament-simulator`)
  4. **Auto-Settled Personal Bet Tracker & Exportable ROI Ledger** (`/bet-tracker`)
- **Confirmed Decision 2 (Bet Settlement Mode)**: Hybrid **Live ESPN Auto-Settlement + Manual Override**, allowing users to grade tracked slips automatically against real finished ESPN scores while retaining manual edit/void controls.
- **Confirmed Decision 3 (Social Graphic Aspect Ratios)**: Support both **9:16 Vertical Story** (WhatsApp Status, TikTok, Instagram Reels) and **1:1 Square Post** (Telegram Channels, X/Twitter, Facebook) with 1-click high-DPI PNG and SVG export.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **In-Play Live Edge & Late-Goal (75'+) Momentum Radar**: Analyzes live ESPN fixtures in real time to flag matches where live Expected Goals (xG) rate, corner pressure, and attacking field tilt project a high probability (>74%) of a **Next Goal** or **Late Goal (75'–90'+)** compared to lagging in-play bookmaker lines.
  2. **Automated Social Graphic & WhatsApp Story Studio**: Transforms today's Top Bankers, SportyBet/1xBet/Bet9ja Booking Codes, CLV Steam Alerts, and 17-Game Mega Jackpot picks into branded, broadcast-grade visual cards in **9:16 Story** and **1:1 Square** formats with instant PNG download and native Web Share API support.
  3. **Interactive Group-Stage & Knockout Tournament Predictor**: Extends knockout bracket modeling to full multi-group tournaments (UEFA Champions League Swiss/Group phase, AFCON, and FIFA World Cup), allowing users to simulate group standings, third-place qualifiers, and full knockout paths to the trophy.
  4. **Auto-Settled Personal Bet Tracker & ROI Ledger**: Provides a personal quantitative ledger where any Bet Slip or single pick can be logged with 1 click, automatically settled against live/finished ESPN scores, analyzed by league and market ROI, and exported as a clean CSV audit log.
- **Target Audience / Persona**: Quantitative football analysts, in-play match traders, African & European accumulator builders, and Telegram/WhatsApp community administrators who share daily branded slips.
- **Key Value**: Bridges pre-match quantitative modeling with **live in-play execution**, **visual viral distribution** (WhatsApp Status / Telegram image cards), and **verified personal ROI auditing**.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **Flow 1 — In-Play Late-Goal Radar**: User opens `/in-play-edge` (or clicks the live alert from the top command ribbon) $\rightarrow$ filters by *Late Goal Alert (70'+)*, *First-Half Goal Spike*, or *Underdog Pressure* $\rightarrow$ inspects live xG-per-10-min rate vs. implied bookmaker probability $\rightarrow$ adds the live selection to the Bet Slip in 1 click.
  - **Flow 2 — Social Graphic & Story Card Studio**: User or Admin selects a template (*Daily 3-Leg Banker*, *Booking Code Ticket*, *CLV Sharp Steam*, or *17-Game Jackpot Brief*), toggles **9:16 Vertical Story** or **1:1 Square**, switches language (`EN / SW / FR / PT / AR`), and clicks **Download PNG Card** or **Share to WhatsApp/Telegram**.
  - **Flow 3 — Group + Knockout Tournament Predictor**: User selects a competition (*AFCON*, *World Cup*, or *UCL*), predicts or Monte-Carlo simulates group matchdays, watches group tables and Goal Difference update in real time, and advances qualifiers into the interactive R16 $\rightarrow$ Final bracket.
  - **Flow 4 — Auto-Settled Personal Bet Tracker**: User clicks **Track in Ledger** from the Bet Slip or logs a custom play $\rightarrow$ clicks **Sync Live ESPN Results** to automatically grade finished legs (`WON`, `LOST`, `PUSH`) $\rightarrow$ reviews equity curve, yield %, and CLV beat rate $\rightarrow$ exports full history to CSV.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-density institutional sports broadcast console governed by strict scannability and typographic discipline.
  - *Color Palette & Mood*: **60-30-10 color allocation**—60% neutral slate canvas (`--background`), 30% flat structural card surfaces with 1px hairline borders (`border-border`), and 10% semantic accents (`#16A34A` emerald for positive edge/won legs, `#D97706` amber for in-play pressure warnings, `#DC2626` crimson for late-goal red-zone alerts).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for crisp structural headers and team names paired with `JetBrains Mono` (`font-mono tabular-nums`) for all live minutes, xG rates, probabilities, odds, and ROI figures.
  - *Component Styling & Layout*: Full 1440px desktop workspace grid with single-elevation cards, compact 40px data table rows, and unboxed metadata separated by `·` dividers (zero-pill static metadata discipline).
- **Interactive Feedback & Motion**:
  - Instant $\le 150\text{ms}$ filter transitions, real HTML5 Canvas / SVG-to-PNG rasterization with toast confirmation, skeleton loading states matching table geometry, and clean empty states with 1-click sample seeding.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side HTML5 Canvas & SVG Rasterization for Social Cards**
  - *Chosen Approach*: Render 9:16 (1080×1920) and 1:1 (1080×1080) social graphics directly in the browser using deterministic SVG/Canvas rendering with zero external image dependencies.
  - *Why*: Guarantees instant offline-capable PNG downloads with crisp typography, team badges, and localized text in all 5 languages (`EN`, `SW`, `FR`, `PT`, `AR`) without server latency or broken external URLs.
  - *Alternatives Considered*: Server-side headless Puppeteer screenshots (rejected due to slow cold starts and memory overhead).
- **Decision 2: Hybrid Live ESPN Auto-Settlement + Local Persistence for Bet Tracker**
  - *Chosen Approach*: Store user bet ledger entries in structured local storage synced with the Bankroll Manager, and match fixture names/dates against `/api/football?type=live` and `/api/football?type=upcoming` to auto-grade `1X2`, `Over/Under 2.5`, `BTTS`, and `Double Chance` markets.
  - *Why*: Works immediately for both guest and signed-in users without mandatory account friction while still grading real-world football results automatically.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                   PredictPro Quantitative State & API Layer                   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────┐  │
│  │ Live ESPN Telemetry API │  │ Admin Override & Booking│  │ 5-Language    │  │
│  │ (/api/football?type=..) │  │ Code Sync Store         │  │ i18n Engine   │  │
│  └────────────┬────────────┘  └────────────┬────────────┘  └───────┬───────┘  │
└───────────────┼────────────────────────────┼───────────────────────┼──────────┘
                │                            │                       │
      ┌─────────┴──────────┬─────────────────┴─────────┬─────────────┴────────┐
      ▼                    ▼                           ▼                      ▼
┌──────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌──────────────────┐
│ In-Play Live Edge│ │ Social Graphic &    │ │ Group + Knockout    │ │ Auto-Settled     │
│ & 75'+ Goal Radar│ │ Story Card Studio   │ │ Tournament Simulator│ │ Personal Bet     │
│ (/in-play-edge)  │ │ (/social-studio)    │ │ (/tournament-sim)   │ │ Tracker & Ledger │
├──────────────────┤ ├─────────────────────┤ ├─────────────────────┤ ├──────────────────┤
│• Live xG/min rate│ │• 9:16 Story & 1:1   │ │• 4-Team Group Tables│ │• 1-Click Log from│
│• 75'+ Late Goal %│ │  Square Canvas/SVG  │ │• Poisson Sim All    │ │  Bet Slip Drawer │
│• Lagging Bookie  │ │• 5-Lang Card Themes │ │  Group Matchdays    │ │• ESPN Score Auto-│
│  Edge Calculator │ │• 1-Click PNG Export │ │• Auto-Seed R16 ->   │ │  Grader + CSV    │
│• 1-Tap Slip Add  │ │  & Admin Tab Sync   │ │  Final Bracket      │ │  Audit Export    │
└──────────────────┘ └─────────────────────┘ └─────────────────────┘ └──────────────────┘
```

- **Data Model & State**:
  - `InPlayMomentumSignal`: Tracks `matchId`, `minute`, `currentScore`, `liveXgHome`, `liveXgAway`, `last15MinShots`, `nextGoalModelProbPct`, `bookieNextGoalOdds`, `lateGoalEdgePct`, and `alertType` (`LATE_GOAL_75_PLUS` | `HALF_TIME_SPIKE` | `FAVORITE_TRAILING_PRESSURE`).
  - `SocialCardConfig`: Stores `aspectRatio` (`9:16` | `1:1`), `cardType` (`DAILY_BANKERS` | `BOOKING_CODES` | `CLV_STEAM` | `JACKPOT_17`), `theme` (`OBSIDIAN_EMERALD` | ` STADIUM_SLATE` | `HIGH_CONTRAST_LIGHT`), and `locale` (`en` | `sw` | `fr` | `pt` | `ar`).
  - `TrackedBetEntry`: Stores `id`, `createdAt`, `fixture`, `league`, `market`, `odds`, `stake`, `bookmaker`, `status` (`PENDING` | `WON` | `LOST` | `VOID`), `settledScore`, and `clvEdgePct`.
- **Interactive Component & State Mapping**:
  - **In-Play Edge Filters & Simulator**: Clicking any momentum filter recalculates sorted edge rows; adjusting the live pressure slider updates projected remaining xG and fair Next-Goal odds in real time; clicking **+ Slip** dispatches directly to `useBetSlip()`.
  - **Social Card Canvas Exporter**: Switching aspect ratio, theme, or language immediately re-renders the live SVG preview and enables 1-click high-resolution `1080px` PNG raster download via an offscreen HTML5 `<canvas>`.
  - **Group-to-Knockout Progression**: Editing any group fixture score or clicking **Simulate Group Stage** recalculates points, Goal Difference, and tie-breakers (`PTS -> GD -> GF`), automatically populating the Round of 16 knockout bracket.
  - **Bet Tracker Auto-Grader**: Clicking **Auto-Settle via Live ESPN** fetches finished scores, evaluates market rules (`1X2`, `Over 2.5`, `BTTS`, `1X/X2`), updates bankroll P&L and equity curves, and unlocks 1-click CSV download.
