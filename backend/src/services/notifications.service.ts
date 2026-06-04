import type { Prisma } from "@prisma/client";
import { prisma } from "../config/db.js";

export async function createUserNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  meta?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      meta: input.meta
    }
  });
}
