import { describe, expect, it } from "vitest";
import { projectName } from "../src/project";

describe("project baseline", () => {
  it("exposes the project name through a public module", () => {
    expect(projectName()).toBe("Image Description");
  });
});
