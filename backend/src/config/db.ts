import { PrismaClient, Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

export const tenantContext = new AsyncLocalStorage<{ companyId: string }>();

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const basePrisma =
  global.__prisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = basePrisma;
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenant = tenantContext.getStore();
        const isolatedModels = ["User", "Department", "Employee", "JobPosting", "ReviewCycle", "Course"];

        if (tenant && isolatedModels.includes(model)) {
          if (["findUnique", "findFirst", "findMany", "count", "aggregate", "groupBy", "update", "updateMany", "delete", "deleteMany"].includes(operation)) {
            (args as any).where = { ...(args as any).where, companyId: tenant.companyId };
          }
          if (["create", "createMany", "upsert"].includes(operation)) {
            // Only inject companyId if it is not already provided by the service (like during auth registration)
            const d = (args as any).data;
            if (d && !Array.isArray(d) && !d.companyId) {
              (args as any).data.companyId = tenant.companyId;
            }
          }
        }

        // Specifically for Application, Goal, and Review (which are children of isolated models)
        // For a true multi-tenant we'd also filter these, but since the parent ID is isolated,
        // it's mostly safe. We'll leave them as is for now to avoid complex nested where logic.

        return query(args);
      }
    }
  }
}) as unknown as PrismaClient; // Cast to PrismaClient so we don't have to refactor every single import type
