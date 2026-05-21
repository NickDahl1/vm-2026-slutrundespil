/**
 * MockAdapter — reads finished results from a local JSON file.
 *
 * Use this adapter for local testing and CI dry-runs before a real API is
 * connected. The JSON file is at scripts/mock-results.json by default but
 * can be overridden via the constructor.
 *
 * Usage:
 *   USE_MOCK=true npx tsx scripts/sync-results.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { MatchResultAdapter, ExternalMatchResult } from "./types.js";

export class MockAdapter implements MatchResultAdapter {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ?? join(process.cwd(), "scripts", "mock-results.json");
  }

  async fetchResults(): Promise<ExternalMatchResult[]> {
    const raw = readFileSync(this.filePath, "utf-8");
    const data = JSON.parse(raw) as unknown;

    if (!Array.isArray(data)) {
      throw new Error(
        `MockAdapter: expected an array in ${this.filePath}, got ${typeof data}`
      );
    }

    return data as ExternalMatchResult[];
  }
}
