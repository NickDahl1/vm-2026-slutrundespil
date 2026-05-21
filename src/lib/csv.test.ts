import { describe, it, expect } from "vitest";
import { toCsvRow, toCsv } from "./csv";

describe("toCsvRow", () => {
  it("joins simple values with commas", () => {
    expect(toCsvRow(["a", "b", "c"])).toBe("a,b,c");
  });

  it("wraps values containing commas in double quotes", () => {
    expect(toCsvRow(["a,b", "c"])).toBe('"a,b",c');
  });

  it("escapes double quotes by doubling them", () => {
    expect(toCsvRow(['say "hi"', "ok"])).toBe('"say ""hi""",ok');
  });

  it("wraps values containing newlines in double quotes", () => {
    expect(toCsvRow(["line1\nline2", "x"])).toBe('"line1\nline2",x');
  });

  it("renders null as empty string", () => {
    expect(toCsvRow([null, "x"])).toBe(",x");
  });

  it("renders undefined as empty string", () => {
    expect(toCsvRow([undefined, "x"])).toBe(",x");
  });

  it("renders numbers correctly", () => {
    expect(toCsvRow([1, 2.5, 0])).toBe("1,2.5,0");
  });

  it("renders booleans as strings", () => {
    expect(toCsvRow([true, false])).toBe("true,false");
  });
});

describe("toCsv", () => {
  it("produces header row + data rows", () => {
    const result = toCsv(["name", "points"], [["Alice", 10], ["Bob", 7]]);
    const lines = result.split("\r\n");
    expect(lines[0]).toBe("name,points");
    expect(lines[1]).toBe("Alice,10");
    expect(lines[2]).toBe("Bob,7");
  });

  it("returns just the header for empty data", () => {
    const result = toCsv(["id", "name"], []);
    expect(result).toBe("id,name");
  });
});
