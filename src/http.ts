import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AttribloomApiClient } from "./client.js";
import { createMcpServer } from "./server.js";

/** Serve MCP over Streamable HTTP at /mcp. For self-hosting; stdio is the default. */
export async function startHttp(): Promise<void> {
  const apiKey = process.env["ATTRIBLOOM_API_KEY"];
  const baseUrl = process.env["ATTRIBLOOM_BASE_URL"] ?? "https://api.attribloom.com";
  const port = Number(process.env["PORT"] ?? "3000");
  const host = process.env["HOST"] ?? "127.0.0.1";

  const client = apiKey ? new AttribloomApiClient(apiKey, baseUrl) : undefined;
  const server = createMcpServer({ client });

  // Stateless Streamable HTTP transport: one transport instance handles every request.
  const transport = new StreamableHTTPServerTransport();

  await server.connect(transport);

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url !== "/mcp") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    let body: unknown;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    if (chunks.length > 0) {
      const text = Buffer.concat(chunks).toString("utf8");
      try {
        body = JSON.parse(text);
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json" }));
        return;
      }
    }

    await transport.handleRequest(req, res, body);
  });

  httpServer.listen(port, host, () => {
    console.error(`Attribloom MCP HTTP server listening on http://${host}:${port}/mcp`);
  });
}
