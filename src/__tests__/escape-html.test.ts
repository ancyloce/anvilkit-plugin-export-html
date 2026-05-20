import { describe, expect, it } from "vitest";

import { escapeAttr, escapeHtml } from "../internal/escape-html.js";

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

describe("escape-html", () => {
  it("escapeHtml maps each special character to its entity", () => {
    expect(escapeHtml("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("escapeAttr additionally maps equals signs", () => {
    expect(escapeAttr("&<>\"'=")).toBe("&amp;&lt;&gt;&quot;&#39;&#61;");
  });

  it("escapes ampersands before other entities", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("never leaves raw angle brackets or equals signs in fuzzed output", () => {
    const random = rng(42);
    const alphabet = Array.from("&<>\"'=abcABC 123!@#");

    for (let index = 0; index < 1000; index += 1) {
      const length = Math.floor(random() * 51);
      let input = "";

      for (let charIndex = 0; charIndex < length; charIndex += 1) {
        const alphabetIndex = Math.floor(random() * alphabet.length);
        input += alphabet[alphabetIndex] ?? "";
      }

      const escapedHtml = escapeHtml(input);
      const escapedAttr = escapeAttr(input);

      expect(escapedHtml).not.toContain("<");
      expect(escapedHtml).not.toContain(">");
      expect(escapedAttr).not.toContain("<");
      expect(escapedAttr).not.toContain(">");
      expect(escapedAttr).not.toContain("=");
    }
  });
});
