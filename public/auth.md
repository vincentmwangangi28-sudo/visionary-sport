# PredictPro.guru Agent Authentication & Registration (auth.md)

This document defines the machine-readable and human-readable agent registration, authentication, and credential provisioning flows for **PredictPro.guru** (`https://predictpro.guru`) per the **auth.md** specification, **RFC 9728** (OAuth Protected Resource Metadata), and **RFC 8414** (OAuth 2.0 Authorization Server Metadata).

## Audience

Autonomous AI agents, Model Context Protocol (MCP) clients, Agent-to-Agent (A2A) orchestrators, and quantitative sports analytics bots accessing `https://predictpro.guru` APIs, MCP tools (`/mcp`), and protected prediction endpoints.

## Discovery Endpoints

- **OAuth Protected Resource Metadata (RFC 9728)**: `https://predictpro.guru/.well-known/oauth-protected-resource`
- **OAuth 2.0 Authorization Server Metadata (RFC 8414)**: `https://predictpro.guru/.well-known/oauth-authorization-server`
- **OpenID Connect Discovery 1.0**: `https://predictpro.guru/.well-known/openid-configuration`
- **JSON Web Key Set (JWKS)**: `https://predictpro.guru/.well-known/jwks.json`
- **Web Bot Auth Signature Directory**: `https://predictpro.guru/.well-known/http-message-signatures-directory`

## Agent Registration & Provisioning Endpoints

- **Registration Endpoint (`register_uri`)**: `POST https://predictpro.guru/api/agent/register`
- **Token Endpoint (`token_endpoint`)**: `POST https://predictpro.guru/api/oauth/token`
- **Claim / Ownership Upgrade Endpoint (`claim_uri`)**: `POST https://predictpro.guru/api/agent/claim`
- **Token Revocation Endpoint (`revocation_uri`)**: `POST https://predictpro.guru/api/oauth/revoke`

## Supported Registration & Identity Flows

### 1. Identity Assertion / ID-JAG (`urn:ietf:params:oauth:token-type:id-jag`)

Agents holding an Identity Assertion JWT Authorization Grant (`urn:ietf:params:oauth:token-type:id-jag`) can exchange their assertion directly at `POST https://predictpro.guru/api/agent/register` or `POST https://predictpro.guru/api/oauth/token`:

```json
{
  "identity_type": "identity_assertion",
  "assertion_type": "urn:ietf:params:oauth:token-type:id-jag",
  "assertion": "eyJhbGciOiJFZERTQSIsInR5cCI6ImlkLWphZytqd3QifQ...",
  "credential_type": "bearer_token",
  "scopes": ["predictions:read", "jackpots:read", "odds:read"]
}
```

### 2. Verified Email Identity Assertion (`verified_email`)

Agents acting on behalf of a human operator can register with a `verified_email` assertion and complete account claiming via `claim_uri` (`https://predictpro.guru/api/agent/claim`):

```json
{
  "identity_type": "identity_assertion",
  "assertion_type": "verified_email",
  "email": "agent-operator@example.com",
  "credential_type": "api_key",
  "scopes": ["predictions:read", "jackpots:read", "analytics:read"]
}
```

### 3. Anonymous Ephemeral Agent Provisioning (`anonymous`)

Read-only agents can provision an immediate anonymous Bearer token without prior human sign-in, and optionally upgrade/claim it later via `https://predictpro.guru/api/agent/claim`:

```json
{
  "identity_type": "anonymous",
  "agent_name": "research-agent",
  "credential_type": "bearer_token",
  "scopes": ["predictions:read", "jackpots:read"]
}
```

## Credential Usage

Supply issued credentials in the `Authorization` HTTP request header using the `Bearer` scheme:

```http
GET https://predictpro.guru/api/predictions HTTP/1.1
Host: predictpro.guru
Authorization: Bearer pp_agent_live_token
Accept: application/json
```

## Supported Scopes

- `predictions:read` — Read daily AI football predictions, 1X2 probabilities, and Bivariate Poisson scorelines
- `jackpots:read` — Read 17-game SportPesa Mega Jackpot and Betika Midweek Jackpot pools and permutations
- `odds:read` — Read dropping odds, sharp steam movement, and +EV value bets
- `analytics:read` — Access Expected Goals (xG), ELO ratings, and H2H tactical breakdowns
- `agent:register` — Register and manage agent credentials
