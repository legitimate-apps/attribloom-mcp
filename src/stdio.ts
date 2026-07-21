import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AttribloomApiClient } from "./client.js";
import { createMcpServer } from "./server.js";

/** Serve MCP over stdio. This is the transport MCP clients (Claude Code, Cursor) spawn. */
export async function startStdio(): Promise<void> {
  const apiKey = process.env["ATTRIBLOOM_API_KEY"];
  const baseUrl = process.env["ATTRIBLOOM_BASE_URL"] ?? "https://api.attribloom.com";

  const client = apiKey ? new AttribloomApiClient(apiKey, baseUrl) : undefined;
  const server = createMcpServer({ client });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
