import { describe, expect, it } from "vitest";
import { scoreResume } from "./resume-scoring.js";

describe("scoreResume", () => {
  it("scores resumes against required skills", () => {
    const result = scoreResume(
      ["React", "Node.js", "PostgreSQL", "System Design"],
      "Built React dashboards, Node.js APIs, and optimized PostgreSQL queries."
    );

    expect(result.extractedSkills).toEqual(["React", "Node.js", "PostgreSQL"]);
    expect(result.gaps).toEqual(["System Design"]);
    expect(result.aiMatchScore).toBe(75);
  });
});
