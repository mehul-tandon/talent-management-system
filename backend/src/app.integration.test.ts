import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  $queryRaw: vi.fn(),
  jobPosting: {
    findFirst: vi.fn()
  },
  application: {
    create: vi.fn()
  }
};

const enqueueResumeProcessing = vi.fn();
const enqueueEmailDelivery = vi.fn();
const uploadResumeFile = vi.fn();
const extractResumeText = vi.fn();

vi.mock("./config/db.js", () => ({
  prisma: prismaMock
}));

vi.mock("./services/background-jobs.service.js", () => ({
  enqueueResumeProcessing,
  enqueueEmailDelivery,
  startBackgroundJobs: vi.fn(),
  stopBackgroundJobs: vi.fn()
}));

vi.mock("./services/storage.service.js", () => ({
  uploadResumeFile
}));

vi.mock("./services/resume-extraction.service.js", () => ({
  extractResumeText
}));

const { app } = await import("./app.js");
const integration = process.env.ENABLE_SOCKET_TESTS === "true" ? describe : describe.skip;

integration("app integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    enqueueResumeProcessing.mockResolvedValue({ queued: false });
    enqueueEmailDelivery.mockResolvedValue({ queued: false });
    uploadResumeFile.mockResolvedValue({
      url: "http://localhost:5000/uploads/resumes/jane-doe-resume.txt"
    });
    extractResumeText.mockResolvedValue("React Node TypeScript hiring pipelines");
  });

  it("returns health information", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("accepts a multipart application submission and queues follow-up work", async () => {
    prismaMock.jobPosting.findFirst.mockResolvedValue({
      id: "job_1",
      title: "Senior Frontend Engineer",
      requiredSkills: ["React", "TypeScript"],
      status: "OPEN",
      deletedAt: null
    });

    prismaMock.application.create.mockImplementation(async ({ data }) => ({
      id: "application_1",
      ...data
    }));

    const response = await request(app)
      .post("/api/v1/jobs/job_1/apply")
      .field("applicantName", "Jane Doe")
      .field("email", "jane@example.com")
      .attach("resume", Buffer.from("React TypeScript candidate"), {
        filename: "resume.txt",
        contentType: "text/plain"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resumeUrl).toContain("/uploads/resumes/");
    expect(response.body.data.stage).toBe("SCREENING");
    expect(uploadResumeFile).toHaveBeenCalled();
    expect(extractResumeText).toHaveBeenCalled();
    expect(enqueueResumeProcessing).toHaveBeenCalledWith("application_1");
    expect(enqueueEmailDelivery).toHaveBeenCalledTimes(1);
  });

  it("blocks protected employee routes without a bearer token", async () => {
    const response = await request(app).post("/api/v1/employees").send({
      email: "new.employee@tms.local"
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });
});
