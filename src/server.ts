import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AttribloomApiClient } from "./client.js";
import { AttribloomApiError } from "./client.js";
import { CONNECT_STORE_GUIDANCE, GET_STARTED_GUIDANCE } from "./guidance.js";

export type ToolContext = {
  /** Optional API client. Guidance tools work without it; data tools require it. */
  client?: AttribloomApiClient | undefined;
};

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError ? { isError: true as const } : {}),
  };
}

function authRequired(): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [
      {
        type: "text" as const,
        text: "No ATTRIBLOOM_API_KEY configured. Set it to a tenant API key (eak_live_...).",
      },
    ],
    isError: true,
  };
}

function apiErrorResult(err: AttribloomApiError): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  if (err.status === 401) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Your API key is invalid or has been revoked. Check ATTRIBLOOM_API_KEY and create a new key in the dashboard if needed.`,
        },
      ],
      isError: true,
    };
  }
  if (err.status === 403) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Your API key lacks the required scope for this action. Create a key with the appropriate read:* scope (read:campaigns, read:conversions, read:commissions, read:payouts).`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text: `Attribloom API error (${err.status}): ${err.message}` }],
    isError: true,
  };
}

/** Read the real package version so `serverInfo` can never drift from what was published. */
function packageVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../package.json") as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createMcpServer(ctx: ToolContext): McpServer {
  const server = new McpServer({
    name: "attribloom-mcp",
    version: packageVersion(),
  });

  server.tool("get_started_guidance", "Public onboarding steps for Attribloom (no API key required)", async () =>
    textResult(GET_STARTED_GUIDANCE),
  );

  server.tool("connect_store_guidance", "How to connect Shopify or an iOS app (no API key required)", async () =>
    textResult(CONNECT_STORE_GUIDANCE),
  );

  server.tool(
    "whoami",
    "Prove the API key works and show the tenant + granted scopes",
    async () => {
      if (!ctx.client) return authRequired();
      try {
        const me = await ctx.client.whoami();
        return textResult(
          `Tenant: ${me.tenantName} (${me.tenantId})\nGranted scopes: ${me.scopes.join(", ") || "none"}`,
        );
      } catch (err) {
        if (err instanceof AttribloomApiError) return apiErrorResult(err);
        throw err;
      }
    },
  );

  server.tool(
    "list_campaigns",
    "List the tenant's campaigns and their commission rules",
    async () => {
      if (!ctx.client) return authRequired();
      try {
        const campaigns = await ctx.client.listCampaigns();
        if (campaigns.length === 0) return textResult("No campaigns found.");
        const lines = campaigns.map(
          (c) =>
            `- ${c.name} (${c.id})\n  destination: ${c.defaultDestinationUrl}\n  webPurchase: ${c.webPurchase}\n  commissionRule: ${c.commissionRule ? `${c.commissionRule.kind} (${c.commissionRule.currency})` : "none"}`,
        );
        return textResult(lines.join("\n"));
      } catch (err) {
        if (err instanceof AttribloomApiError) return apiErrorResult(err);
        throw err;
      }
    },
  );

  server.tool(
    "campaign_readout",
    "Read conversions + matured commission summary for the tenant (No-Lie real ledger sums)",
    async () => {
      if (!ctx.client) return authRequired();
      try {
        const [conversions, commissions] = await Promise.all([
          ctx.client.listConversions(),
          ctx.client.commissionSummary(),
        ]);

        const convLines = conversions.map(
          (c) =>
            `- ${c.id} | ${c.externalId} | ${c.eventType} | ${c.status} | gross ${c.grossMinor} ${c.currency} | commission ${c.commissionMinor ?? "n/a"} ${c.currency}`,
        );
        const commissionLines = commissions.map(
          (c) => `- ${c.currency}: matured ${c.maturedMinor} (minor units)`,
        );

        const parts: string[] = [];
        parts.push(`Conversions (${conversions.length}):`);
        parts.push(convLines.length ? convLines.join("\n") : "No conversions found.");
        parts.push("");
        parts.push("Commission summary:");
        parts.push(commissionLines.length ? commissionLines.join("\n") : "No matured commissions.");
        return textResult(parts.join("\n"));
      } catch (err) {
        if (err instanceof AttribloomApiError) return apiErrorResult(err);
        throw err;
      }
    },
  );

  server.tool(
    "list_payouts",
    "List the tenant's payouts",
    async () => {
      if (!ctx.client) return authRequired();
      try {
        const payouts = await ctx.client.listPayouts();
        if (payouts.length === 0) return textResult("No payouts found.");
        const lines = payouts.map(
          (p) =>
            `- ${p.id} | affiliate ${p.affiliateId} | ${p.amountMinor} ${p.currency} | status ${p.status}`,
        );
        return textResult(lines.join("\n"));
      } catch (err) {
        if (err instanceof AttribloomApiError) return apiErrorResult(err);
        throw err;
      }
    },
  );

  server.tool(
    "payout_eligibility",
    "Check per-affiliate available balance vs payout threshold",
    async () => {
      if (!ctx.client) return authRequired();
      try {
        const eligibility = await ctx.client.payoutEligibility();
        const lines = eligibility.affiliates.map(
          (a) =>
            `- ${a.affiliateId}: available ${a.availableMinor} ${eligibility.currency} | threshold ${eligibility.thresholdMinor} | eligible: ${a.eligible}`,
        );
        const header = `Currency: ${eligibility.currency} | threshold: ${eligibility.thresholdMinor}`;
        return textResult(lines.length ? [header, ...lines].join("\n") : `${header}\nNo affiliates with available balance.`);
      } catch (err) {
        if (err instanceof AttribloomApiError) return apiErrorResult(err);
        throw err;
      }
    },
  );

  return server;
}
