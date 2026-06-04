import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/db.js";
import { startBackgroundJobs, stopBackgroundJobs } from "./services/background-jobs.service.js";

const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT}`);
  void startBackgroundJobs();
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(async () => {
    await stopBackgroundJobs();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
