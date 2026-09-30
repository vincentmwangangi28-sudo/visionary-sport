---
name: value-bet-scanner
description: Identify positive Expected Value (+EV) football wagers and sharp dropping odds steam where AI Poisson probabilities exceed bookmaker implied probabilities.
---

# PredictPro Value Bet & Dropping Odds Scanner Skill

Use this skill to discover mispriced bookmaker lines, calculate Expected Value ($\text{EV} = P_{\text{AI}} \times \text{Odds} - 1$), and compute optimal Kelly Criterion stake sizing.

## Endpoints

- **Value Bets Hub**: `GET https://predictpro.guru/value-bets` (supports `Accept: text/markdown`)
- **Dropping Odds Steam Radar**: `GET https://predictpro.guru/dropping-odds` (supports `Accept: text/markdown`)
- **MCP Tool**: `calculate_value_bets` at `https://predictpro.guru/mcp`

## Quantitative Criteria

- **Minimum Edge**: $+3.5\%$ Expected Value ($\text{EV} > 0.035$)
- **Model Inputs**: Bivariate Poisson $\lambda_{\text{Home}}, \lambda_{\text{Away}}$ with Dixon-Coles low-scoring correlation $\rho$ and ELO strength differential.
