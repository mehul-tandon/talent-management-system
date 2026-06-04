import { prisma } from "../../config/db.js";
import { parseResumeAgainstJob } from "../../services/resume-parser.service.js";
import { AppError } from "../../utils/app-error.js";

export async function processApplicationResume(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true
    }
  });

  if (!application) {
    throw new AppError("Application not found", 404, "APPLICATION_NOT_FOUND");
  }

  const parsed = await parseResumeAgainstJob({
    requiredSkills: application.job.requiredSkills,
    resumeText: application.resumeText ?? null
  });

  return prisma.application.update({
    where: { id: applicationId },
    data: {
      ...parsed,
      stage: parsed.aiMatchScore >= 65 ? "SCREENING" : "APPLIED"
    }
  });
}
