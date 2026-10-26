# PredictPro (`predictpro.guru`) — Phase 10 Overall Project Master Plan (100% Free-Access Quantitative Suite)

## 1. Executive Summary & Architectural Scope
Per your direction, **PredictPro remains 100% free-to-access with zero payment walls, checkout gates, or paid subscriptions**. Phase 10 elevates the overall project with four institutional-grade quantitative, product, and international growth pillars:

1. **Closing Line Value (CLV) & Sharp Steam Scanner (`/closing-line-value`)**: Tracks **Opening Bookmaker Odds vs. Current Sharp/Pinnacle Lines**, calculates **CLV Edge %**, detects **Syndicate Steam Moves** ($\ge 8\%$ rapid implied probability shift), and audits PredictPro's historical **CLV Beat Rate %** across Europe, Africa (CAF/FKF/NPFL/PSL), and the Americas.
2. **Correlated Same-Game Parlay (SGP) Gaussian Copula Builder (`/sgp-builder`)**: An interactive multi-leg Same-Game Parlay laboratory that calculates the **pairwise correlation coefficient ($\rho \in [-0.65, +0.72]$)** between Match Winner, Over/Under Goals, BTTS, Corners, Cards, and Goalscorer legs—revealing hidden **Correlated True Odds vs. Bookmaker SGP Pricing**.
3. **5-Language & Regional Localization Engine (`EN`, `Swahili`, `Français`, `Português`, `العربية`)**: Instant language selector in the top navigation & display preferences that translates core navigation, football betting market terminology, and regional broadcast snippets across East/West Africa, Francophone/North Africa, Europe, and Latin America.
4. **Admin CLV Seeder & Multilingual 5-Language Broadcast Studio (`/admin`)**: A new turnkey Admin tab allowing you to pin custom Sharp Steam/CLV alerts and generate **1-Click Ready-to-Paste Telegram/WhatsApp broadcasts in English, Swahili, French, Portuguese, and Arabic**.

---

## 2. Core Functional Pillars & Technical Specifications

### Pillar 1: Closing Line Value (CLV) & Sharp Steam Scanner (`/closing-line-value`)
- **Files**: `src/services/clvAndCopulaService.ts` & `src/pages/ClosingLineValuePage.tsx`
- **Capabilities**:
  - **Opening vs. Current vs. Fair Poisson Line Matrix**: Displays `Opening Odds`, `Current Market Odds`, `Sharp Pinnacle Line`, `Implied Shift %`, and `CLV Edge %` in `tabular-nums`.
  - **Steam Move & Reverse Line Movement (RLM) Filters**: Filter by `All Sharp Moves`, `Syndicate Steam (>10% Drop)`, `Late Money Alerts`, and `African & CAF Leagues`.
  - **Interactive CLV Calculator**: Users can enter the odds they locked in vs. the closing odds (and bookmaker margin) to calculate exact **No-Vig Closing Line Value %** and long-term expected ROI.
  - **1-Tap Slip & Bankroll Integration**: Add any positive-CLV play to the Bet Slip or sync directly to the Bankroll Portfolio.

### Pillar 2: Correlated Same-Game Parlay (SGP) Gaussian Copula Builder (`/sgp-builder`)
- **Files**: `src/pages/SgpCopulaBuilderPage.tsx` (wired into `/sgp-builder` and linked from `/bet-builder-predictions` and `Navbar.tsx`)
- **Capabilities**:
  - **Fixture Selector + 6-Market Leg Matrix**: Choose a fixture and toggle up to 5 legs from:
    - *1X2 / Double Chance*
    - *Total Match Goals (Over/Under 1.5, 2.5, 3.5)*
    - *Both Teams to Score (Yes/No)*
    - *Match Corners (Over 8.5, 9.5, 10.5)*
    - *Referee Booking Points / Cards (Over 3.5, 4.5 Cards)*
    - *Star Player 1+ Shot on Target / Anytime Goalscorer*
  - **Gaussian Copula Pairwise Correlation Matrix ($\rho$)**:
    - Explicitly models positive correlations (e.g., *Favorite Win + Over 2.5 Goals* $\rho = +0.44$; *Underdog Double Chance + Over 4.5 Cards* $\rho = +0.38$; *High Pressing Favorite + Over 9.5 Corners* $\rho = +0.41$) and negative correlations (e.g., *Under 2.5 Goals + BTTS Yes* $\rho = -0.52$).
    - Compares **Uncorrelated Multiplied Odds** vs. **Copula-Adjusted True Fair Odds** vs. **Bookmaker Quoted SGP Odds**, highlighting the exact **Correlation Value Boost %**.
  - **1-Click Load SGP into Bet Slip / Copy SGP Tactical Brief**.

### Pillar 3: 5-Language & Regional Localization Engine (`EN / SW / FR / PT / AR`)
- **Files**: `src/services/i18nLocalizationService.ts` & `src/components/Navbar.tsx`
- **Capabilities**:
  - Supports **English (`EN`)**, **Kiswahili (`SW`)**, **Français (`FR`)**, **Português (`PT`)**, and **العربية (`AR`)** persisted in `localStorage` and broadcast across components via custom event.
  - **Localized Market Dictionary & UI Bar**: Translates core navigation labels, market names (*Home Win / Ushindi wa Nyumbani / Victoire Domicile / Vitória Casa / فوز المضيف*, *Over 2.5 Goals / Zaidi ya Magoli 2.5 / Plus de 2,5 Buts*, *BTTS*, *Jackpot*), and provides a quick language switcher inside `Navbar.tsx`.

### Pillar 4: Admin CLV & Multilingual Broadcast Studio (`/admin`)
- **File**: `src/components/admin/AdminClvAndLocalizationTab.tsx` (wired into `/admin` under **CLV & 5-Lang Studio**)
- **Capabilities**:
  - **Custom Sharp Steam & CLV Alert Pinning**: Pin or edit custom Opening-to-Current odds drops that immediately sync to `/closing-line-value`.
  - **1-Click 5-Language Telegram/WhatsApp Broadcast Generator**: Automatically translates today's Top Bankers, SportyBet/1xBet/Bet9ja Booking Codes, and 17-Game Jackpot brief into **English, Kiswahili, French, Portuguese, and Arabic** with 1-click Copy buttons for international channels.

---

## 3. File-by-File Execution Checklist
1. `src/services/i18nLocalizationService.ts` — Create the 5-language (`EN`, `SW`, `FR`, `PT`, `AR`) dictionary, reactive state hook/listener, and multilingual broadcast formatter.
2. `src/services/clvAndCopulaService.ts` — Create the Closing Line Value (CLV) no-vig calculator, Sharp Steam feed state, and Gaussian Copula SGP correlation matrix engine.
3. `src/pages/ClosingLineValuePage.tsx` — Create the `/closing-line-value` Sharp Steam & CLV Beat Rate page with interactive No-Vig CLV calculator and 1-tap slip actions.
4. `src/pages/SgpCopulaBuilderPage.tsx` — Create the `/sgp-builder` Correlated Same-Game Parlay (SGP) Gaussian Copula Laboratory.
5. `src/components/admin/AdminClvAndLocalizationTab.tsx` — Create the Admin CLV Alert Manager & 5-Language Telegram/WhatsApp Copy-Paste Broadcast Studio.
6. `src/components/Navbar.tsx`, `src/pages/AdminDashboard.tsx`, `src/components/admin/AdminOverviewTab.tsx`, and `src/App.tsx` — Wire the 5-Language switcher, new public routes (`/closing-line-value`, `/sgp-builder`), and new Admin tab.
7. Run `lint_applet` and `compile_applet` to verify zero errors.
