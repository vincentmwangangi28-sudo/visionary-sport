---
name: football-predictions
description: Retrieve daily AI football predictions, Bivariate Poisson scoreline probabilities, Expected Goals (xG) differentials, and 1X2 Banker picks across 40+ global leagues.
---

# PredictPro Football Predictions Skill

Use this skill when an AI agent needs verified mathematical football predictions, Expected Goals (xG) telemetry, or 1X2 / BTTS / Over 2.5 Goals probabilities from `https://predictpro.guru`.

## Endpoints

- **Daily Predictions Catalog (Markdown)**: Send `GET https://predictpro.guru/` with `Accept: text/markdown`
- **MCP Server Endpoint**: `POST https://predictpro.guru/mcp` (JSON-RPC 2.0 `tools/call` -> `get_daily_football_predictions`)
- **OpenAPI Specification**: `GET https://predictpro.guru/openapi.json`

## Supported Leagues

- English Premier League (`/premier-league-predictions`)
- UEFA Champions League (`/champions-league-predictions`)
- Spanish La Liga (`/la-liga-predictions`)
- Italian Serie A (`/serie-a-predictions`)
- German Bundesliga (`/bundesliga-predictions`)
- French Ligue 1 (`/ligue-1-predictions`)
- Kenyan Premier League (`/kpl-predictions`)
- Major League Soccer (`/us-soccer-predictions`)

## Example Request

```http
GET https://predictpro.guru/premier-league-predictions HTTP/1.1
Host: predictpro.guru
Accept: text/markdown
```
