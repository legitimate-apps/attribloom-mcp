import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * Regression guard for the 2026-07-21 packaging defects that made @attribloom/mcp@0.0.1
 * unusable via its own documented install path (`npx -y @attribloom/mcp`):
 *   1. two bins, neither matching the unscoped package name -> npx could not choose one
 *   2. no shebang on the bin -> the shell executed JS as bash
 */

const read = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const pkg = JSON.parse(read("../package.json")) as {
  version: string;
  bin: Record<string, string>;
  files: string[];
  license: string;
};

describe("packaging", () => {
  it("declares exactly one bin so `npx -y @attribloom/mcp` can resolve it", () => {
    // npx runs a package's sole bin regardless of its name; with two bins and neither named
    // `mcp` (the unscoped package name), npx fails with "could not determine executable to run".
    expect(Object.keys(pkg.bin)).toEqual(["attribloom-mcp"]);
  });

  it("points the bin at the CLI entry, which carries a node shebang", () => {
    expect(pkg.bin["attribloom-mcp"]).toBe("dist/cli.js");
    expect(read("../src/cli.ts").split("\n")[0]).toBe("#!/usr/bin/env node");
  });

  it("ships the LICENSE it declares", () => {
    expect(pkg.license).toBe("MIT");
    expect(pkg.files).toContain("LICENSE");
    expect(read("../LICENSE")).toContain("MIT License");
  });
});
