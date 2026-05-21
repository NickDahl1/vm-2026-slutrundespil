/**
 * Minimal CSV serialization helpers.
 * No external dependencies — pure string operations.
 */

export type CsvValue = string | number | boolean | null | undefined;

/** Serialize a single row as a CSV line (RFC 4180). */
export function toCsvRow(values: CsvValue[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      const str = String(v);
      // Wrap in double quotes if value contains comma, double-quote, or newline.
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

/** Serialize a full table (headers + rows) as a CSV string. */
export function toCsv(
  headers: string[],
  rows: CsvValue[][]
): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)];
  return lines.join("\r\n");
}

/** Create a UTF-8 BOM-prefixed CSV blob suitable for Excel. */
export function toCsvWithBom(headers: string[], rows: CsvValue[][]): Uint8Array {
  const bom = "﻿"; // UTF-8 BOM — makes Excel open with correct encoding
  const content = bom + toCsv(headers, rows);
  return new TextEncoder().encode(content);
}
