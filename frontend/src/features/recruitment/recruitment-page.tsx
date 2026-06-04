import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "../../components/page-header";
import { api } from "../../lib/api";
import type {
  Application,
  ApplicationStage,
  Department,
  JobPosting,
  JobStatus
} from "../../types/api";

interface JobFormState {
  title: string;
  departmentId: string;
  jdText: string;
  requiredSkills: string;
  openings: number;
  status: JobStatus;
}

interface ApplicationFormState {
  jobId: string;
  applicantName: string;
  email: string;
  resumeText: string;
}

const jobStatuses: JobStatus[] = ["DRAFT", "OPEN", "ON_HOLD", "CLOSED"];
const applicationStages: ApplicationStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED"
];

const defaultJobForm: JobFormState = {
  title: "",
  departmentId: "",
  jdText: "",
  requiredSkills: "",
  openings: 1,
  status: "OPEN"
};

const defaultApplicationForm: ApplicationFormState = {
  jobId: "",
  applicantName: "",
  email: "",
  resumeText: ""
};

function splitSkills(value: string) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function buildJobState(job: JobPosting): JobFormState {
  return {
    title: job.title,
    departmentId: job.departmentId ?? job.department.id,
    jdText: job.jdText,
    requiredSkills: job.requiredSkills.join(", "),
    openings: job.openings,
    status: job.status
  };
}

export function RecruitmentPage() {
  const queryClient = useQueryClient();
  const [jobForm, setJobForm] = useState<JobFormState>(defaultJobForm);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(defaultApplicationForm);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [editJobForm, setEditJobForm] = useState<JobFormState>(defaultJobForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/admin/departments")
  });

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.get<JobPosting[]>("/jobs")
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => api.get<Application[]>("/applications")
  });

  const jobs = jobsQuery.data ?? [];
  const openJobs = jobs.filter((job) => job.status === "OPEN");
  const applications = applicationsQuery.data ?? [];

  useEffect(() => {
    if (jobForm.departmentId || !departmentsQuery.data?.length) {
      return;
    }

    setJobForm((current) => ({
      ...current,
      departmentId: departmentsQuery.data?.[0]?.id ?? ""
    }));
  }, [departmentsQuery.data, jobForm.departmentId]);

  useEffect(() => {
    if (applicationForm.jobId || openJobs.length === 0) {
      return;
    }

    setApplicationForm((current) => ({
      ...current,
      jobId: openJobs[0].id
    }));
  }, [applicationForm.jobId, openJobs]);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }

    setEditJobForm(buildJobState(selectedJob));
  }, [selectedJob]);

  const createJobMutation = useMutation({
    mutationFn: () =>
      api.post<JobPosting>("/jobs", {
        title: jobForm.title,
        departmentId: jobForm.departmentId,
        jdText: jobForm.jdText,
        requiredSkills: splitSkills(jobForm.requiredSkills),
        openings: Number(jobForm.openings),
        status: jobForm.status
      }),
    onSuccess: (job) => {
      setJobForm((current) => ({
        ...defaultJobForm,
        departmentId: current.departmentId
      }));
      setApplicationForm((current) => ({
        ...current,
        jobId: current.jobId || job.id
      }));
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: () => {
      if (!selectedJob) {
        throw new Error("No job selected");
      }

      return api.patch<JobPosting>(`/jobs/${selectedJob.id}`, {
        title: editJobForm.title,
        departmentId: editJobForm.departmentId,
        jdText: editJobForm.jdText,
        requiredSkills: splitSkills(editJobForm.requiredSkills),
        openings: Number(editJobForm.openings),
        status: editJobForm.status
      });
    },
    onSuccess: (job) => {
      setSelectedJob(job);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    }
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.set("applicantName", applicationForm.applicantName);
      payload.set("email", applicationForm.email);

      if (applicationForm.resumeText.trim()) {
        payload.set("resumeText", applicationForm.resumeText.trim());
      }

      if (resumeFile) {
        payload.set("resume", resumeFile);
      }

      return api.postForm<Application>(`/jobs/${applicationForm.jobId}/apply`, payload);
    },
    onSuccess: () => {
      setApplicationForm((current) => ({
        ...defaultApplicationForm,
        jobId: current.jobId
      }));
      setResumeFile(null);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    }
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ApplicationStage }) =>
      api.patch<Application>(`/applications/${id}/stage`, { stage }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });

  const reparseMutation = useMutation({
    mutationFn: (id: string) => api.post<Application>(`/applications/${id}/parse`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });

  function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createJobMutation.mutate();
  }

  function handleUpdateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateJobMutation.mutate();
  }

  function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyMutation.mutate();
  }

  return (
    <section className="page-grid">
      <PageHeader
        title="Recruitment & ATS"
        description="Run requisition intake, candidate submissions, and stage changes from one operational view."
        action={<div className="chip-badge">{applications.length} applications</div>}
      />

      <div className="two-column-grid">
        <article className="panel">
          <h3>Create Requisition</h3>
          <form className="form-grid" onSubmit={handleCreateJob}>
            <div className="field-grid">
              <label>
                Job title
                <input
                  required
                  value={jobForm.title}
                  onChange={(event) =>
                    setJobForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Openings
                <input
                  min={1}
                  required
                  type="number"
                  value={jobForm.openings}
                  onChange={(event) =>
                    setJobForm((current) => ({
                      ...current,
                      openings: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Department
                <select
                  required
                  value={jobForm.departmentId}
                  onChange={(event) =>
                    setJobForm((current) => ({
                      ...current,
                      departmentId: event.target.value
                    }))
                  }
                >
                  <option value="">Select a department</option>
                  {departmentsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={jobForm.status}
                  onChange={(event) =>
                    setJobForm((current) => ({
                      ...current,
                      status: event.target.value as JobStatus
                    }))
                  }
                >
                  {jobStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Required skills
              <input
                placeholder="Node.js, React, SQL"
                value={jobForm.requiredSkills}
                onChange={(event) =>
                  setJobForm((current) => ({
                    ...current,
                    requiredSkills: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Job description
              <textarea
                required
                rows={6}
                value={jobForm.jdText}
                onChange={(event) =>
                  setJobForm((current) => ({ ...current, jdText: event.target.value }))
                }
              />
            </label>

            {createJobMutation.error ? (
              <p className="error-text">
                {createJobMutation.error instanceof Error
                  ? createJobMutation.error.message
                  : "Unable to create requisition"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={createJobMutation.isPending} type="submit">
                {createJobMutation.isPending ? "Creating..." : "Create requisition"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h3>Submit Candidate</h3>
          <form className="form-grid" onSubmit={handleApplicationSubmit}>
            <div className="field-grid">
              <label>
                Open job
                <select
                  required
                  value={applicationForm.jobId}
                  onChange={(event) =>
                    setApplicationForm((current) => ({
                      ...current,
                      jobId: event.target.value
                    }))
                  }
                >
                  <option value="">Select an open job</option>
                  {openJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Candidate email
                <input
                  required
                  type="email"
                  value={applicationForm.email}
                  onChange={(event) =>
                    setApplicationForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              Candidate name
              <input
                required
                value={applicationForm.applicantName}
                onChange={(event) =>
                  setApplicationForm((current) => ({
                    ...current,
                    applicantName: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Resume upload
              <input
                accept=".pdf,.txt,.md,.rtf"
                type="file"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <label>
              Resume text
              <textarea
                placeholder="Paste resume text if available. PDF/TXT upload also works."
                rows={6}
                value={applicationForm.resumeText}
                onChange={(event) =>
                  setApplicationForm((current) => ({
                    ...current,
                    resumeText: event.target.value
                  }))
                }
              />
            </label>

            {applyMutation.error ? (
              <p className="error-text">
                {applyMutation.error instanceof Error
                  ? applyMutation.error.message
                  : "Unable to submit application"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={applyMutation.isPending} type="submit">
                {applyMutation.isPending ? "Submitting..." : "Submit candidate"}
              </button>
            </div>
          </form>
        </article>
      </div>

      {selectedJob ? (
        <article className="panel">
          <div className="row-between">
            <div>
              <h3>Edit Requisition</h3>
              <p className="muted-copy">{selectedJob.title}</p>
            </div>
            <button className="secondary-button" onClick={() => setSelectedJob(null)} type="button">
              Close
            </button>
          </div>

          <form className="form-grid" onSubmit={handleUpdateJob}>
            <div className="field-grid">
              <label>
                Job title
                <input
                  required
                  value={editJobForm.title}
                  onChange={(event) =>
                    setEditJobForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={editJobForm.status}
                  onChange={(event) =>
                    setEditJobForm((current) => ({
                      ...current,
                      status: event.target.value as JobStatus
                    }))
                  }
                >
                  {jobStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-grid">
              <label>
                Department
                <select
                  value={editJobForm.departmentId}
                  onChange={(event) =>
                    setEditJobForm((current) => ({
                      ...current,
                      departmentId: event.target.value
                    }))
                  }
                >
                  {departmentsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Openings
                <input
                  min={1}
                  type="number"
                  value={editJobForm.openings}
                  onChange={(event) =>
                    setEditJobForm((current) => ({
                      ...current,
                      openings: Number(event.target.value)
                    }))
                  }
                />
              </label>
            </div>

            <label>
              Required skills
              <input
                value={editJobForm.requiredSkills}
                onChange={(event) =>
                  setEditJobForm((current) => ({
                    ...current,
                    requiredSkills: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Job description
              <textarea
                rows={6}
                value={editJobForm.jdText}
                onChange={(event) =>
                  setEditJobForm((current) => ({ ...current, jdText: event.target.value }))
                }
              />
            </label>

            {updateJobMutation.error ? (
              <p className="error-text">
                {updateJobMutation.error instanceof Error
                  ? updateJobMutation.error.message
                  : "Unable to update requisition"}
              </p>
            ) : null}

            <div className="toolbar-row">
              <button className="primary-button" disabled={updateJobMutation.isPending} type="submit">
                {updateJobMutation.isPending ? "Saving..." : "Save requisition"}
              </button>
            </div>
          </form>
        </article>
      ) : null}

      <div className="two-column-grid">
        <article className="panel">
          <h3>Requisitions</h3>
          <div className="list-stack">
            {jobs.map((job) => (
              <div className="stack-card" key={job.id}>
                <div className="row-between">
                  <strong>{job.title}</strong>
                  <span className="status-pill">{job.status}</span>
                </div>
                <p>{job.department.name}</p>
                <p className="muted-copy">{job.requiredSkills.join(", ") || "No skills listed"}</p>
                <div className="row-between">
                  <span className="muted-copy">{job._count?.applications ?? 0} applications</span>
                  <button
                    className="secondary-button small-button"
                    onClick={() => setSelectedJob(job)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Candidate Pipeline</h3>
          <div className="list-stack">
            {applications.map((application) => (
              <div className="stack-card" key={application.id}>
                <div className="row-between">
                  <strong>{application.applicantName}</strong>
                  <span className="status-pill">{application.stage}</span>
                </div>
                <p>{application.job.title}</p>
                <p className="muted-copy">
                  Match score: {application.aiMatchScore ?? 0}% | Skills:{" "}
                  {application.extractedSkills.join(", ") || "Pending parse"}
                </p>
                <div className="field-grid compact-grid">
                  <label>
                    Stage
                    <select
                      defaultValue={application.stage}
                      onChange={(event) =>
                        updateStageMutation.mutate({
                          id: application.id,
                          stage: event.target.value as ApplicationStage
                        })
                      }
                    >
                      {applicationStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="inline-actions">
                    <button
                      className="secondary-button small-button"
                      onClick={() => reparseMutation.mutate(application.id)}
                      type="button"
                    >
                      Re-parse
                    </button>
                    {application.resumeUrl ? (
                      <a className="secondary-button small-button link-button" href={application.resumeUrl} target="_blank" rel="noreferrer">
                        Resume
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
