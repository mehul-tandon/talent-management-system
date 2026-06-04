import { describe, expect, it, vi } from "vitest";
import { generateEmployeeCode } from "./employee-code.js";

describe("generateEmployeeCode", () => {
  it("returns a unique employee code", async () => {
    const prisma = {
      employee: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };

    const code = await generateEmployeeCode(prisma as never);

    expect(code).toMatch(/^EMP-[A-F0-9]{8}$/);
    expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
  });

  it("retries when the candidate code already exists", async () => {
    const prisma = {
      employee: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "existing-employee" })
          .mockResolvedValueOnce(null)
      }
    };

    const code = await generateEmployeeCode(prisma as never);

    expect(code).toMatch(/^EMP-[A-F0-9]{8}$/);
    expect(prisma.employee.findUnique).toHaveBeenCalledTimes(2);
  });
});
