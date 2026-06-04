import bcrypt from "bcryptjs";
import { PrismaClient, Role, EmployeeStatus, JobStatus, ReviewCycleType, ReviewStatus, ReviewType, GoalStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.compensation.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewCycle.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: { name: "Demo Company Inc." }
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const engineering = await prisma.department.create({
    data: { name: "Engineering", location: "Bengaluru", costCenter: "ENG-001", companyId: company.id }
  });

  const peopleOps = await prisma.department.create({
    data: { name: "People Operations", location: "Bengaluru", costCenter: "HR-001", companyId: company.id }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "hr.admin@tms.local",
      passwordHash,
      role: Role.HR_ADMIN,
      companyId: company.id
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@tms.local",
      passwordHash,
      role: Role.DEPT_MANAGER,
      companyId: company.id
    }
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: "employee@tms.local",
      passwordHash,
      role: Role.EMPLOYEE,
      companyId: company.id
    }
  });

  const manager = await prisma.employee.create({
    data: {
      userId: managerUser.id,
      companyId: company.id,
      empCode: "EMP-1001",
      firstName: "Priya",
      lastName: "Nair",
      designation: "Engineering Manager",
      hireDate: new Date("2023-04-01"),
      status: EmployeeStatus.ACTIVE,
      departmentId: engineering.id,
      location: "Bengaluru",
      skills: ["Leadership", "Node.js", "Architecture"]
    }
  });

  const employee = await prisma.employee.create({
    data: {
      userId: employeeUser.id,
      companyId: company.id,
      empCode: "EMP-1002",
      firstName: "Arjun",
      lastName: "Shah",
      designation: "Frontend Engineer",
      hireDate: new Date("2024-01-15"),
      status: EmployeeStatus.ACTIVE,
      departmentId: engineering.id,
      managerId: manager.id,
      location: "Remote",
      skills: ["React", "TypeScript", "UI"]
    }
  });

  await prisma.employee.create({
    data: {
      userId: adminUser.id,
      companyId: company.id,
      empCode: "EMP-1000",
      firstName: "Meera",
      lastName: "Kapoor",
      designation: "HR Administrator",
      hireDate: new Date("2022-07-01"),
      status: EmployeeStatus.ACTIVE,
      departmentId: peopleOps.id,
      location: "Bengaluru",
      skills: ["Hiring", "People Ops", "Policies"]
    }
  });

  const job = await prisma.jobPosting.create({
    data: {
      title: "Senior Full Stack Engineer",
      companyId: company.id,
      departmentId: engineering.id,
      jdText: "Looking for React, Node.js, PostgreSQL, system design, mentorship, and API design experience.",
      requiredSkills: ["React", "Node.js", "PostgreSQL", "System Design", "Mentorship"],
      openings: 2,
      status: JobStatus.OPEN,
      postedById: adminUser.id
    }
  });

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      applicantName: "Karan Verma",
      email: "karan.verma@example.com",
      resumeText: "5 years React and Node.js experience. Worked with PostgreSQL and microservices. Mentored junior engineers.",
      aiMatchScore: 86,
      aiSummary: "Strong full stack profile with relevant stack alignment.",
      extractedSkills: ["React", "Node.js", "PostgreSQL", "Mentorship"],
      strengths: ["Hands-on React delivery", "Backend API experience"],
      gaps: ["Explicit system design depth"],
      stage: "SCREENING"
    }
  });

  await prisma.interview.create({
    data: {
      applicationId: application.id,
      interviewerId: manager.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: "Technical Round",
      feedback: {
        focus: ["API design", "React architecture"]
      }
    }
  });

  const reviewCycle = await prisma.reviewCycle.create({
    data: {
      name: "FY25 Annual Review",
      companyId: company.id,
      type: ReviewCycleType.ANNUAL,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-31"),
      status: ReviewStatus.SUBMITTED
    }
  });

  await prisma.goal.createMany({
    data: [
      {
        employeeId: employee.id,
        title: "Improve design system adoption",
        description: "Drive consistent usage of shared UI building blocks.",
        dueDate: new Date("2026-09-30"),
        progress: 55,
        status: GoalStatus.IN_PROGRESS
      },
      {
        employeeId: manager.id,
        title: "Reduce time-to-hire for engineering",
        description: "Close open reqs within 35 days average.",
        dueDate: new Date("2026-08-31"),
        progress: 35,
        status: GoalStatus.IN_PROGRESS
      }
    ]
  });

  await prisma.review.create({
    data: {
      cycleId: reviewCycle.id,
      revieweeId: employee.id,
      reviewerId: manager.id,
      type: ReviewType.MANAGER,
      status: ReviewStatus.SUBMITTED,
      comments: "Consistent ownership and strong UI execution.",
      ratings: {
        delivery: 4,
        quality: 4,
        collaboration: 5,
        learning: 4
      }
    }
  });

  await prisma.course.createMany({
    data: [
      {
        title: "System Design for Product Engineers",
        companyId: company.id,
        description: "Design scalable backend and frontend systems.",
        durationHrs: 12,
        level: "Intermediate",
        skills: ["System Design", "Scalability", "APIs"]
      },
      {
        title: "Performance Reviews That Work",
        companyId: company.id,
        description: "Write useful feedback and calibrate fairly.",
        durationHrs: 6,
        level: "Manager",
        skills: ["Feedback", "Coaching"]
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
