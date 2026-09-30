---
name: jackpot-permutations
description: Generate 17-game SportPesa Mega Jackpot, 15-game Betika Midweek Jackpot, and 20-game Mozzart Super Grand Jackpot Banker locks and Double Chance (2^N) permutation slips.
---

# PredictPro Jackpot Permutations Skill

Use this skill to query live multi-game jackpot pools, calculate Bivariate Poisson 1X2 probabilities, and construct optimal Double Chance (`1X`, `X2`, `12`) permutation hedges.

## Endpoints

- **Live Jackpot Hub (Markdown / HTML)**: `GET https://predictpro.guru/jackpot-predictions` (supports `Accept: text/markdown`)
- **MCP Tool**: `get_mega_jackpot_analysis` at `https://predictpro.guru/mcp`

## Supported Jackpot Pools

1. **SportPesa Mega Jackpot (17 Games)** — Base stake KSh 99, prize KSh 350,000,000+
2. **Betika Midweek Jackpot (15 Games)** — Base stake KSh 15, prize KSh 15,000,000
3. **Mozzart Super Grand Jackpot (20 Games)** — Base stake KSh 50, prize KSh 200,000,000
4. **SportyBet 12-Game Jackpot (12 Games)** — Base stake NGN 100, prize NGN 50,000,000

## Permutation Formula

For $N$ Double Chance hedges across a pool of $M$ fixtures, total combinations equal $2^N$ and total stake equals $\text{Base Stake} \times 2^N$.
