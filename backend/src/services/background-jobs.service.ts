import net from "node:net";
import { Queue, Worker, type JobsOptions } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { processApplicationResume } from "../modules/recruitment/recruitment-processing.service.js";
import { sendEmail, type EmailPayload } from "./email.service.js";

interface ResumeProcessingJob {
  applicationId: string;
}

interface ReportExportJob {
  requestedBy: string;
  reportType: "dashboard";
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1_000
  },
  removeOnComplete: {
    count: 50
  },
  removeOnFail: {
    count: 100
  }
};

let resumeQueue: Queue<ResumeProcessingJob> | null = null;
let emailQueue: Queue<EmailPayload> | null = null;
let reportQueue: Queue<ReportExportJob> | null = null;
let workers: Worker[] = [];
let queuesEnabled = false;

const connection = {
  url: env.REDIS_URL
};

async function probeRedis() {
  const target = new URL(env.REDIS_URL);
  const port = Number(target.port || 6379);

  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({
      host: target.hostname,
      port
    });

    const finish = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1_500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function ensureQueues() {
  resumeQueue ??= new Queue<ResumeProcessingJob>("resume-processing", {
    connection,
    defaultJobOptions
  });
  emailQueue ??= new Queue<EmailPayload>("email-delivery", {
    connection,
    defaultJobOptions
  });
  reportQueue ??= new Queue<ReportExportJob>("report-exports", {
    connection,
    defaultJobOptions
  });
}

export async function startBackgroundJobs() {
  if (!env.ENABLE_BACKGROUND_JOBS) {
    logger.info("Background jobs disabled by configuration");
    return false;
  }

  try {
    const redisAvailable = await probeRedis();
    if (!redisAvailable) {
      throw new Error("Redis probe failed");
    }

    ensureQueues();

    workers = [
      new Worker<ResumeProcessingJob>(
        "resume-processing",
        async (job) => {
          await processApplicationResume(job.data.applicationId);
        },
        { connection }
      ),
      new Worker<EmailPayload>(
        "email-delivery",
        async (job) => {
          await sendEmail(job.data);
        },
        { connection }
      ),
      new Worker<ReportExportJob>(
        "report-exports",
        async (job) => {
          logger.info("Report export job received", job.data);
        },
        { connection }
      )
    ];

    workers.forEach((worker) => {
      worker.on("failed", (job, error) => {
        logger.error(`Background job failed for queue ${worker.name}`, {
          jobId: job?.id,
          error
        });
      });
    });

    queuesEnabled = true;
    logger.info("Redis-backed background jobs started");
    return true;
  } catch (error) {
    logger.warn("Redis unavailable, background work will run inline", error);
    await stopBackgroundJobs();
    return false;
  }
}

export async function stopBackgroundJobs() {
  queuesEnabled = false;
  await Promise.all(workers.map((worker) => worker.close().catch(() => undefined)));
  workers = [];

  await Promise.all(
    [resumeQueue, emailQueue, reportQueue]
      .filter((queue): queue is Queue => Boolean(queue))
      .map((queue) => queue.close().catch(() => undefined))
  );
  resumeQueue = null;
  emailQueue = null;
  reportQueue = null;
}

export function backgroundJobsEnabled() {
  return queuesEnabled;
}

export async function enqueueResumeProcessing(applicationId: string) {
  if (!queuesEnabled || !resumeQueue) {
    await processApplicationResume(applicationId);
    return { queued: false };
  }

  await resumeQueue.add("parse-resume", { applicationId });
  return { queued: true };
}

export async function enqueueEmailDelivery(payload: EmailPayload) {
  if (!queuesEnabled || !emailQueue) {
    await sendEmail(payload);
    return { queued: false };
  }

  await emailQueue.add("send-email", payload);
  return { queued: true };
}
