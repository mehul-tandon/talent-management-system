import { ApplicationStage } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { enqueueEmailDelivery, enqueueResumeProcessing } from "../../services/background-jobs.service.js";
import { extractResumeText } from "../../services/resume-extraction.service.js";
import { uploadResumeFile } from "../../services/storage.service.js";
import { AppError } from "../../utils/app-error.js";
import { scoreResume } from "../../utils/resume-scoring.js";
import { processApplicationResume } from "./recruitment-processing.service.js";

export async function listJobs(publicOnly = false) {
  return prisma.jobPosting.findMany({
    where: publicOnly ? { status: "OPEN", deletedAt: null } : { deletedAt: null },
    include: {
      department: true,
      _count: { select: { applications: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createJob(input: {
  title: string;
  departmentId: string;
  jdText: string;
  requiredSkills: string[];
  openings: number;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ON_HOLD";
}, postedById: string) {
  return prisma.jobPosting.create({
    data: {
      ...input,
      companyId: undefined as any,
      postedById
    }
  });
}

export async function updateJob(
  id: string,
  input: {
    title?: string;
    departmentId?: string;
    jdText?: string;
    requiredSkills?: string[];
    openings?: number;
    status?: "DRAFT" | "OPEN" | "CLOSED" | "ON_HOLD";
  }
) {
  const job = await prisma.jobPosting.findFirst({
    where: { id, deletedAt: null }
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  return prisma.jobPosting.update({
    where: { id },
    data: { ...input, companyId: undefined as any }
  });
}

export async function applyToJob(
  jobId: string,
  input: { applicantName: string; email: string; resumeUrl?: string; resumeText?: string },
  resumeFile?: Express.Multer.File
) {
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobId, status: "OPEN", deletedAt: null }
  });

  if (!job) {
    throw new AppError("Open job not found", 404, "JOB_NOT_FOUND");
  }

  let resumeText = input.resumeText?.trim() || null;
  let resumeUrl = input.resumeUrl;

  if (resumeFile) {
    const storedResume = await uploadResumeFile(resumeFile);
    resumeUrl = storedResume.url;
    const extractedText = await extractResumeText(resumeFile);

    if (extractedText) {
      resumeText = resumeText ? `${resumeText}\n\n${extractedText}` : extractedText;
    }
  }

  if (!resumeText && !resumeUrl) {
    throw new AppError(
      "A resume upload, resume text, or resume URL is required",
      400,
      "RESUME_REQUIRED"
    );
  }

  const parsed = scoreResume(job.requiredSkills, resumeText);

  const application = await prisma.application.create({
    data: {
      jobId,
      applicantName: input.applicantName,
      email: input.email,
      resumeUrl,
      resumeText,
      ...parsed,
      stage: parsed.aiMatchScore >= 65 ? "SCREENING" : "APPLIED"
    }
  });

  await Promise.all([
    enqueueResumeProcessing(application.id),
    enqueueEmailDelivery({
      to: input.email,
      subject: `Application received for ${job.title}`,
      text: `Hi ${input.applicantName}, your application for ${job.title} has been received. Our team will review it shortly.`,
      html: `<p>Hi ${input.applicantName},</p><p>Your application for <strong>${job.title}</strong> has been received. Our team will review it shortly.</p>`
    })
  ]);

  return application;
}

export async function listApplications(stage?: ApplicationStage) {
  return prisma.application.findMany({
    where: stage ? { stage } : undefined,
    include: {
      job: {
        include: { department: true }
      },
      interviews: true
    },
    orderBy: { appliedAt: "desc" }
  });
}

export async function parseApplication(id: string) {
  return processApplicationResume(id);
}

export async function updateApplicationStage(
  id: string,
  stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED"
) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true }
  });

  if (!application) {
    throw new AppError("Application not found", 404, "APPLICATION_NOT_FOUND");
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { stage }
  });

  await enqueueEmailDelivery({
    to: application.email,
    subject: `Application update for ${application.job.title}`,
    text: `Hi ${application.applicantName}, your application is now in the ${stage} stage for ${application.job.title}.`,
    html: `<p>Hi ${application.applicantName},</p><p>Your application is now in the <strong>${stage}</strong> stage for <strong>${application.job.title}</strong>.</p>`
  });

  return updated;
}
