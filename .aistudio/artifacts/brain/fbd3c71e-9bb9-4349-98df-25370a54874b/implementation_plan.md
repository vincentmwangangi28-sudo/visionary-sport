# PredictPro Phase 13: Quantitative Edge, Cash-Out Hedging, Arbitrage & Universal Slip Conversion Suite

Phase 13 expands PredictPro (`predictpro.guru`) with five high-utility quantitative and user-acquisition modules requested under "proceed with all": an **Acca Cash-Out & Live Hedge Calculator**, a **Multi-Bookmaker Arbitrage & Surebet Matrix**, a **Verified Tipster Profiles & Yield Leaderboard Hub**, a **Universal Cross-Bookmaker Booking Code Converter & Validator**, and a **Player Props, Shots on Target & Referee Cards Model**, all integrated into the homepage Pro Quantitative Suite grid, top navigation, and global command ribbon.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user responded `"proceed with all"` to the Phase 13 planning options. All five functional pillars and homepage/navigation surfaces are included in this plan for final review before code execution.

- **Confirmed Decision 1 (Full Phase 13 Tool Suite)**: Build all five quantitative and growth pillars:
  1. **Acca Cash-Out & Live Hedge Calculator (`/cashout-calculator`)**: Lock in guaranteed profit when the early legs of an accumulator win and one final leg remains, comparing bookmaker cash-out offers against manual 2-way/3-way counter-hedging stakes.
  2. **Multi-Bookmaker Arbitrage & Surebet Matrix (`/arbitrage-finder`)**: Detect risk-free 2-way (`Over/Under`, `BTTS`, `Draw No Bet`) and 3-way (`1X2`) surebets across SportyBet, Betika, SportPesa, Bet9ja, 1xBet, and Pinnacle with automated stake-split and currency-adjusted net profit calculators.
  3. **Verified Tipster Profiles & Yield Leaderboard (`/tipsters`)**: Showcase verified community and model analysts with 30-day ROI curves, Closing Line Value (CLV) grades, win-streak badges, one-click slip tailing, and PredictPro Coin follow/unlock actions.
  4. **Universal Cross-Bookmaker Booking Code Converter (`/code-converter`)**: Convert slip booking codes seamlessly between SportyBet, Betika, SportPesa, Bet9ja, 1xBet, and Betway with leg-by-leg market mapping, odds drift inspection, and one-click load into the PredictPro Bet Slip Drawer.
  5. **Player Props, Shots on Target & Referee Cards Model (`/player-props`)**: Per-90 Poisson and negative-binomial projections for player shots on target, anytime goalscorer probabilities, player fouls committed, and referee card strictness indices.
- **Confirmed Decision 2 (Surface & Navigation Architecture)**: Surface all Phase 13 tools inside the homepage **Pro Quantitative Suite & Bet Tracking** showcase, the **Navbar** (`Pro Tools` and `Community & Growth` dropdown menus), the **Global Matchday Command Ribbon**, and the **Footer**.

---

## 1. Overview & Core Concept

- **What It Does**: Empowers sports bettors and quantitative analysts to protect active accumulators via mathematical hedging, capture cross-bookmaker pricing inefficiencies (surebets), convert booking codes across African and global sportsbooks in seconds, follow verified high-ROI tipsters, and price granular player/referee prop markets.
- **Target Audience / Persona**:
  - **Accumulator Punters**: Users with 4 out of 5 legs won who need to know whether their bookmaker's cash-out offer is fair or how much to stake on `Double Chance` / opposite outcomes to lock in risk-free profit.
  - **Cross-Bookie Value & Arbitrage Hunters**: Bettors holding accounts across SportyBet, Betika, Bet9ja, SportPesa, and 1xBet who want instant booking code translation and risk-free surebet stake splits.
  - **Prop & Micro-Market Analysts**: Punters targeting high-margin player shots on target (`1+ SOT`, `2+ SOT`) and referee booking points.
- **Key Value**: Solves the biggest daily friction points in African and European sports betting—unfair bookmaker cash-out haircuts, incompatible booking codes across bookies, and unverified social media tipsters—turning every converted code and hedged slip into a viral acquisition touchpoint.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Acca Cash-Out & Live Hedge Flow (`/cashout-calculator`)**:
     - User inputs their original accumulator stake, total combined odds, potential payout, bookmaker's current Cash-Out offer, and the live odds for the opposing outcome(s) of the final remaining leg (e.g., if the final leg is `Arsenal to Win`, the opposing hedge is `Draw or Chelsea (X2)`).
     - The calculator immediately computes: **Exact Hedge Stake**, **Net Guaranteed Profit**, **Effective Bookmaker Cash-Out Margin Penalty** (how much value the bookie is shaving off), and an interactive slider to weight profit toward the original acca vs. the hedge leg.
  2. **Multi-Bookmaker Arbitrage & Surebet Matrix Flow (`/arbitrage-finder`)**:
     - Displays live-scanned 2-way and 3-way arbitrage opportunities where the sum of implied probabilities across bookmakers is $< 100\%$ ($\sum (1 / \text{Odds}_i) < 1$).
     - Clicking any opportunity opens the **Interactive Surebet Stake Splitter**, where the user enters their total bankroll allocation (e.g., `10,000 KES` / `$100` / `₦50,000`), optionally rounds stakes to the nearest `50` or `100` to avoid bookmaker stake-limiting flags, and copies individual bookmaker booking codes.
  3. **Universal Booking Code Converter Flow (`/code-converter`)**:
     - User selects a **Source Bookmaker** (e.g., `SportyBet`), enters or selects a sample booking code (e.g., `SP-88492A`), and chooses a **Target Bookmaker** (e.g., `Betika`, `Bet9ja`, `1xBet`, `SportPesa`).
     - The converter parses all legs, displays market-equivalence status (`Exact Match`, `Alternative Line Mapped`), compares total combined odds between source and target bookmaker, generates the translated target booking code, and allows loading all legs directly into the global PredictPro Bet Slip Drawer.
  4. **Verified Tipster Hub Flow (`/tipsters`)**:
     - Filter verified tipsters by specialization (`1X2 Value`, `Over 2.5 Goals`, `High-Odds Accas`, `Player Props`).
     - Inspect each tipster's 30-day verified yield, strike rate, average odds, active open slip, and 10-pick settlement history. Users can follow tipsters, copy their active slip to the Bet Slip Drawer in one click, or unlock VIP slips using PredictPro Coins earned from referrals and Daily Pick'em.
  5. **Player Props & Referee Cards Flow (`/player-props`)**:
     - Filter upcoming fixtures by league and inspect player-level per-90 Shots, Shots on Target (`SOT`), Expected Goals (`xG`), and Fair Odds vs. Bookmaker Odds for `1+ SOT` and `2+ SOT`, alongside a **Referee Card Strictness Table** (yellow/red cards per match, fouls per card, and `Over 4.5 Cards` model edge).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-precision sports trading terminal with clean dark slate surfaces (`#0F172A` canvas, `#1E293B` structural cards), hairline `1px` borders (`border-slate-800`), and single-elevation depth.
  - *Color Palette & Mood*: 60% deep slate neutral background, 30% elevated slate containers and subtle dividers, 10% semantic accents (`#10B981` emerald for positive arbitrage/guaranteed hedge profit, `#06B6D4` cyan for quantitative conversion metrics, `#F59E0B` amber for odds drift or referee card warnings).
  - *Typography & Hierarchy*: Bold geometric headings paired with strict tabular monospace numerals (`font-mono tabular-nums`) across all odds, stakes, payouts, ROI percentages, and per-90 telemetry columns so decimal points align vertically.
  - *Anti-Slop & Zero-Pill Discipline*: Metadata (kickoff times, league names, sample sizes) rendered as clean inline text separated by `·` dividers; interactive filter tabs styled as clean segmented controls with single-line labels (`whitespace-nowrap shrink-0`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Whole-Number Stake Rounding in Arbitrage & Hedge Calculators**
  - *Chosen Approach*: Include a toggleable **"Round Stakes (Anti-Limit Mode)"** option (`Exact Cents` vs. `Nearest 10` / `Nearest 50` / `Nearest 100`) in both the Arbitrage Splitter and Cash-Out Hedge Calculator.
  - *Why*: Betting unusual decimal amounts like `4,387.42` is the #1 reason sportsbooks flag and limit sharp accounts. Rounding stakes while still displaying exact net profit on each outcome gives punters practical, real-world execution utility.
- **Decision 2: Unified Phase 13 Persistence & Coin Economy Integration**
  - *Chosen Approach*: Connect `/tipsters` and `/code-converter` directly with the existing Phase 12 PredictPro Coin wallet and `BetSlipContext`.
  - *Why*: Users who earn PredictPro Coins in the Daily Pick'em Challenge (`/pick-em-challenge`) or Viral Referral Hub (`/referrals`) can immediately spend or use those coins to unlock premium tipster slips on `/tipsters`, creating a closed-loop retention flywheel without requiring forced credit card barriers.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   PredictPro Navigation & Homepage Shell                   │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Navbar & Command     │  │ Index.tsx Pro Suite  │  │ Global BetSlip   │  │
│  │ Ribbon Quick Links   │  │ Showcase Grid        │  │ Context & Drawer │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │                         │                       │
              ▼                         ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   Phase 13 Quantitative & Growth Engine                    │
│              (Client State + LocalStorage + Coin Wallet Sync)              │
├──────────────┬──────────────┬──────────────┬───────────────┬───────────────┤
│              │              │              │               │               │
▼              ▼              ▼              ▼               ▼               │
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ /cashout-  │ │ /arbitrage │ │ /code-     │ │ /tipsters   │ │ /player-    │ │
│ calculator │ │ -finder    │ │ converter  │ │             │ │ props       │ │
│            │ │            │ │            │ │             │ │             │ │
│ • 2-Way &  │ │ • Implied  │ │ • Source → │ │ • 30d ROI & │ │ • Per-90    │ │
│   3-Way    │ │   Prob Sum │ │   Target   │ │   CLV Table │ │   SOT Model │ │
│   Hedge    │ │   Scanner  │ │   Bookie   │ │ • Follow &  │ │ • Referee   │ │
│ • Bookie   │ │ • Anti-    │ │   Parser   │ │   Coin VIP  │ │   Strictness│ │
│   Haircut  │ │   Limit    │ │ • One-Click│ │   Unlock    │ │   Index     │ │
│   Audit    │ │   Rounding │ │   Slip Load│ │ • Copy Slip │ │ • Add Prop  │ │
└────────────┘ └────────────┘ └────────────┘ └─────────────┘ └─────────────┘
```

### Data Model & State

- **Cash-Out & Hedge Scenario (`HedgeCalculation`)**:
  - Stores `accaStake`, `accaTotalOdds`, `bookieCashOutOffer`, `hedgeMarketOdds`, `hedgeBiasPercent` (0% to 100% slider), and `roundingStep`. Computes `optimalHedgeStake`, `profitIfAccaWins`, `profitIfHedgeWins`, `guaranteedMinProfit`, and `bookieOfferDelta` (how much more money manual hedging yields compared to clicking Cash Out).
- **Arbitrage Opportunity (`ArbitrageOpportunity`)**:
  - Contains fixture metadata, market type (`1X2`, `Over/Under 2.5`, `BTTS`, `Asian Handicap`), leg bookmakers, odds per leg, calculated `arbMarginPercent`, and interactive stake allocation with optional rounding.
- **Booking Code Conversion (`BookingCodeConversionResult`)**:
  - Maps source bookmaker code (`SportyBet`, `Betika`, `SportPesa`, `Bet9ja`, `1xBet`, `Betway`) into normalized fixture selections, computes target bookmaker odds and equivalent market labels, generates the target booking code, and supports saving recent conversions in `localStorage`.
- **Verified Tipster (`VerifiedTipsterProfile`)**:
  - Tracks analyst handle, specialty, verified picks count, win rate, 30-day ROI %, average CLV beat, follower count (`followedByUser` persisted in `localStorage`), and active multi-leg slip (with free or PredictPro Coin unlock support).
- **Player Prop & Referee Projection (`PlayerPropProjection` / `RefereeCardProfile`)**:
  - Models player shots per 90, SOT per 90, Poisson probability for `1+ SOT` and `2+ SOT`, fair odds vs. bookmaker odds, plus referee yellow/red cards per game and foul-to-card conversion rates.

### Interactive Component & State Mapping

- **Live Calculation & Preset Loaders**: Every calculator (`/cashout-calculator`, `/arbitrage-finder`, `/code-converter`) includes realistic matchday presets (e.g., *"4/5 Legs Won — Arsenal vs Chelsea Final Leg"*, *"SportyBet `SP-9041X` → Betika Conversion"*) alongside full custom numeric input fields so users can either test scenarios in one click or enter their own live ticket numbers.
- **Direct Bet Slip & Clipboard Integration**: Users can push any converted booking code leg, tipster selection, arbitrage leg, or high-edge player prop directly into the global `BetSlipDrawer` with instant toast confirmation, or copy formatted WhatsApp/Telegram summaries.
