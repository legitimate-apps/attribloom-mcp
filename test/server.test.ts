import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, type ToolContext } from "../src/server.js";
import { AttribloomApiClient, AttribloomApiError } from "../src/client.js";
import { GET_STARTED_GUIDANCE } from "../src/guidance.js";

const V1_TOOLS = [
  "get_started_guidance",
  "whoami",
  "list_campaigns",
  "campaign_readout",
  "list_payouts",
  "payout_eligibility",
  "connect_store_guidance",
];

async function makeClientWithServer(ctx: ToolContext): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const server = createMcpServer(ctx);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}

describe("Attribloom MCP server", () => {
  it("registers exactly the v1 tools", async () => {
    const { client, cleanup } = await makeClientWithServer({});
    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name).sort();
    expect(names).toEqual([...V1_TOOLS].sort());
    await cleanup();
  });

  it("get_started_guidance works with no API key", async () => {
    const { client, cleanup } = await makeClientWithServer({});
    const result = await client.callTool({ name: "get_started_guidance", arguments: {} });
    const text = extractText(result.content);
    expect(text).toContain("Attribloom");
    expect(text).toBe(GET_STARTED_GUIDANCE);
    await cleanup();
  });

  it("whoami returns tenant info when key is valid", async () => {
    const fakeClient = {
      async whoami() {
        return { tenantId: "tenant-123", tenantName: "Test Tenant", scopes: ["read:campaigns"] };
      },
    } as unknown as AttribloomApiClient;

    const { client, cleanup } = await makeClientWithServer({ client: fakeClient });
    const result = await client.callTool({ name: "whoami", arguments: {} });
    const text = extractText(result.content);
    expect(text).toContain("tenant-123");
    expect(text).toContain("Test Tenant");
    expect(text).toContain("read:campaigns");
    await cleanup();
  });

  it("auth tools surface 401 as a helpful message", async () => {
    const fakeClient = {
      async whoami() {
        throw new AttribloomApiError("invalid or missing api key", 401);
      },
    } as unknown as AttribloomApiClient;

    const { client, cleanup } = await makeClientWithServer({ client: fakeClient });
    const result = await client.callTool({ name: "whoami", arguments: {} });
    const text = extractText(result.content);
    expect(text).toContain("invalid");
    expect(result.isError).toBe(true);
    await cleanup();
  });

  it("auth tools surface 403 as a missing-scope message", async () => {
    const fakeClient = {
      async whoami() {
        throw new AttribloomApiError("forbidden", 403);
      },
    } as unknown as AttribloomApiClient;

    const { client, cleanup } = await makeClientWithServer({ client: fakeClient });
    const result = await client.callTool({ name: "whoami", arguments: {} });
    const text = extractText(result.content);
    expect(text).toContain("scope");
    expect(result.isError).toBe(true);
    await cleanup();
  });

  it("campaign_readout calls conversions and commissions summary", async () => {
    const calls: string[] = [];
    const fakeClient = {
      async listConversions() {
        calls.push("conversions");
        return [
          {
            id: "conv-1",
            externalId: "ext-1",
            eventType: "purchase",
            status: "approved",
            grossMinor: "10000",
            netMinor: "9000",
            commissionMinor: "900",
            currency: "USD",
            affiliateId: "aff-1",
            occurredAt: "2026-01-01T00:00:00Z",
            maturedAt: "2026-01-02T00:00:00Z",
          },
        ];
      },
      async commissionSummary() {
        calls.push("commissions");
        return [{ currency: "USD", maturedMinor: "900" }];
      },
    } as unknown as AttribloomApiClient;

    const { client, cleanup } = await makeClientWithServer({ client: fakeClient });
    const result = await client.callTool({ name: "campaign_readout", arguments: {} });
    const text = extractText(result.content);
    expect(calls).toEqual(["conversions", "commissions"]);
    expect(text).toContain("conv-1");
    expect(text).toContain("900");
    await cleanup();
  });
});

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c): c is { type: string; text: string } => typeof c === "object" && c !== null && "text" in c)
    .map((c) => c.text)
    .join("\n");
}
