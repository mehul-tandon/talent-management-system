import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./temporary-password.js";

describe("generateTemporaryPassword", () => {
  it("includes upper, lower, number, and symbol characters", () => {
    const password = generateTemporaryPassword();

    expect(password.length).toBeGreaterThanOrEqual(14);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*]/);
  });
});
