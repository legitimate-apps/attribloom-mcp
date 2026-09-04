# @attribloom/mcp

[![npm](https://img.shields.io/npm/v/@attribloom/mcp)](https://www.npmjs.com/package/@attribloom/mcp)
[![license](https://img.shields.io/npm/l/@attribloom/mcp)](./LICENSE)

Model Context Protocol server for [Attribloom](https://attribloom.com). It lets Claude Code, Claude Desktop, Cursor, and any other MCP client read your tenant's affiliate data and get integration guidance, using a tenant API key.

Attribloom is affiliate attribution and commission tracking for iOS apps (StoreKit 2 and App Store Server Notifications v2) and Shopify stores. Two of the seven tools need no key at all, so an agent can learn how to integrate before you have an account.

## Install

### Claude Code

```bash
claude mcp add attribloom --env ATTRIBLOOM_API_KEY=eak_live_... -- npx -y @attribloom/mcp
```

### Claude Desktop / any client using `mcpServers` JSON

```json
{
  "mcpServers": {
    "attribloom": {
      "command": "npx",
      "args": ["-y", "@attribloom/mcp"],
      "env": {
        "ATTRIBLOOM_API_KEY": "eak_live_..."
      }
    }
  }
}
```

### Cursor

Settings, then MCP, then Add new server:

- **Name:** `attribloom`
- **Type:** `command`
- **Command:** `env ATTRIBLOOM_API_KEY=eak_live_... npx -y @attribloom/mcp`

### HTTP transport (self-hosted)

```bash
ATTRIBLOOM_API_KEY=eak_live_... npx -y @attribloom/mcp --http
```

Serves Streamable HTTP at `http://127.0.0.1:3000/mcp`. Set `PORT` and `HOST` to override.

Get a key from the Attribloom dashboard: Settings, then API keys. Keys are shown once and are scoped read-only.

## Tools

| Tool | Scope required | Description |
| --- | --- | --- |
| `get_started_guidance` | none | Public onboarding steps |
| `connect_store_guidance` | none | How to connect Shopify or an iOS app |
| `whoami` | any key | Verify the key and show tenant plus scopes |
| `list_campaigns` | `read:campaigns` | List campaigns and commission rules |
| `campaign_readout` | `read:conversions` + `read:commissions` | Conversions and matured commission summary |
| `list_payouts` | `read:payouts` | List payouts |
| `payout_eligibility` | `read:payouts` | Per-affiliate available balance vs threshold |

Money mutations (approving an affiliate, creating a campaign, approving a payout) stay in the Attribloom dashboard and are intentionally not exposed here. This server is read-only by design.

Every figure returned comes from the real ledger. There are no estimated or projected numbers.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ATTRIBLOOM_API_KEY` | for data tools | none | Tenant API key from Dashboard, Settings, API keys |
| `ATTRIBLOOM_BASE_URL` | no | `https://api.attribloom.com` | Management API base URL |
| `PORT` | no | `3000` | HTTP transport port |
| `HOST` | no | `127.0.0.1` | HTTP transport host |

Without a key the server still starts and the two guidance tools work. The data tools return a clear "API key required" message rather than failing silently.

## Scope table

| Scope | Tools |
| --- | --- |
| `read:campaigns` | `list_campaigns` |
| `read:conversions` | `campaign_readout` |
| `read:commissions` | `campaign_readout` |
| `read:payouts` | `list_payouts`, `payout_eligibility` |

## Example session

```text
User: connect my Attribloom account
whoami: Tenant: Acme Corp (tenant-123), scopes: read:campaigns, read:conversions, read:commissions, read:payouts

User: what campaigns do I have?
list_campaigns: Summer Launch, Web Purchase funnel

User: how is it performing?
campaign_readout: 42 conversions, $1,240 USD matured commission

User: who can be paid out?
payout_eligibility: 3 affiliates above threshold
```

## CLI

```bash
attribloom-mcp             # stdio transport (default; what MCP clients spawn)
attribloom-mcp --http      # Streamable HTTP transport
attribloom-mcp --version
attribloom-mcp --help
```

## Development

```bash
npm install
npm run build
npm test
```

## Related

- [AttribloomKit](https://github.com/legitimate-apps/AttribloomKit): the Swift package for StoreKit 2 attribution in iOS apps
- [attribloom-examples](https://github.com/legitimate-apps/attribloom-examples): signed postback, Shopify ref preservation, and StoreKit bind examples
- [Agent onboarding guide](https://attribloom.com/agents/ios-affiliate-attribution): zero-auth integration steps written for coding agents
- [OpenAPI spec](https://api.attribloom.com/openapi.json)

## License

MIT
