export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export type Role =
  | "SUPER_ADMIN"
  | "HR_ADMIN"
  | "HR_MANAGER"
  | "DEPT_MANAGER"
  | "EMPLOYEE";

export type EmployeeStatus = "ACTIVE" | "ONBOARDING" | "NOTICE_PERIOD" | "INACTIVE";
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED" | "ON_HOLD";
export type ApplicationStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";
export type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
export type GoalType = "INDIVIDUAL" | "TEAM" | "COMPANY";

export interface Department {
  id: string;
  name: string;
  location?: string | null;
  costCenter?: string | null;
}

export interface Employee {
  id: string;
  userId?: string;
  empCode: string;
  firstName: string;
  lastName: string;
  designation: string;
  status: EmployeeStatus;
  departmentId?: string;
  managerId?: string | null;
  location?: string | null;
  phone?: string | null;
  hireDate?: string;
  skills: string[];
  department?: Department;
  manager?: Pick<Employee, "id" | "firstName" | "lastName" | "designation"> | null;
  user?: {
    email: string;
    role: Role;
    lastLogin?: string | null;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  employee?: Employee | null;
}

export interface JobPosting {
  id: string;
  title: string;
  jdText: string;
  requiredSkills: string[];
  openings: number;
  status: JobStatus;
  departmentId?: string;
  department: Department;
  _count?: {
    applications: number;
  };
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  stage: ApplicationStage;
  aiMatchScore?: number | null;
  aiSummary?: string | null;
  extractedSkills: string[];
  gaps: string[];
  resumeUrl?: string | null;
  resumeText?: string | null;
  appliedAt?: string;
  job: JobPosting;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  progress: number;
  status: GoalStatus;
  type: GoalType;
  dueDate: string;
  employee?: Employee;
}

export interface DashboardMetrics {
  headcount: {
    total: number;
    active: number;
  };
  recruitment: {
    openJobs: number;
    applications: number;
    averageMatchScore: number;
    stageBreakdown: Record<string, number>;
  };
  performance: {
    reviewCount: number;
    averageGoalProgress: number;
  };
}
