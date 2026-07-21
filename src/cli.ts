#!/usr/bin/env node
import { createRequire } from "node:module";
import { startHttp } from "./http.js";
import { startStdio } from "./stdio.js";

const HELP = `attribloom-mcp - Attribloom MCP server

Usage:
  attribloom-mcp             Serve MCP over stdio (default; what MCP clients spawn)
  attribloom-mcp --http      Serve MCP over Streamable HTTP at http://HOST:PORT/mcp
  attribloom-mcp --version   Print the version
  attribloom-mcp --help      Show this help

Environment:
  ATTRIBLOOM_API_KEY   Tenant API key (Dashboard > Settings > API keys). Without it, only the
                       public guidance tools are available; the data tools report that a key
                       is required.
  ATTRIBLOOM_BASE_URL  Management API base URL (default https://api.attribloom.com)
  PORT, HOST           HTTP transport bind address (default 127.0.0.1:3000)

Docs: https://attribloom.com/agents/ios-affiliate-attribution
`;

function version(): string {
  const require = createRequire(import.meta.url);
  const pkg = require("../package.json") as { version?: string };
  return pkg.version ?? "unknown";
}

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(HELP);
} else if (args.has("--version") || args.has("-v")) {
  process.stdout.write(`${version()}\n`);
} else if (args.has("--http")) {
  await startHttp();
} else {
  await startStdio();
}
