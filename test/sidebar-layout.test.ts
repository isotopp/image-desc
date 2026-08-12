import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("sidebar context layout", () => {
  it("places the context label and textarea in a full-width vertical section", () => {
    const html = readFileSync("src/sidebar/sidebar.html", "utf8");
    const css = readFileSync("src/sidebar/sidebar.css", "utf8");

    expect(html).toContain('id="context-section"');
    expect(css).toMatch(
      /#context-section\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
    );
    expect(css).toMatch(
      /#manual-context\s*\{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;/s,
    );
  });
});
