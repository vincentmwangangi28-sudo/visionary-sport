---
name: markdown-negotiation
description: Request clean, token-efficient Markdown representations of any PredictPro.guru page using HTTP Accept: text/markdown content negotiation.
---

# PredictPro Markdown Content Negotiation Skill

PredictPro.guru supports native HTTP content negotiation (`Accept: text/markdown`) across all prediction hubs, league tables, jackpot pools, and analytical guides.

## Usage

Send an HTTP `GET` request with `Accept: text/markdown` to any route on `https://predictpro.guru`:

```http
GET https://predictpro.guru/ HTTP/1.1
Host: predictpro.guru
Accept: text/markdown
```

## Response Headers

- `Content-Type: text/markdown; charset=utf-8`
- `Vary: Accept`
- `X-Markdown-Tokens`: Estimated token count for LLM context window budgeting
- `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
