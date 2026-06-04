<div align="center">

# 🚀 TalentOS — Talent Management System

**A full-stack, production-grade HR platform for managing the complete employee lifecycle.**

![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Database Schema](#-database-schema) · [Security](#-security) · [CI/CD](#-cicd) · [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

**TalentOS** is a comprehensive Talent Management System (TMS) built as a Node.js monorepo, designed to streamline HR operations across the entire employee lifecycle — from **recruitment** and **onboarding** to **performance management**, **learning & development**, **compensation tracking**, and **HR analytics**.

The system implements role-based access control with five distinct user roles, a modular API architecture, and a modern React dashboard, all containerized with Docker for effortless local development and cloud deployment.

---

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| **🔐 Authentication** | JWT-based auth with access/refresh token flow, httpOnly cookie security, and automatic token refresh |
| **👥 Employee Directory** | Full employee profiles with department assignment, manager hierarchy, skills tracking, and status management |
| **📢 Recruitment & ATS** | Job posting lifecycle, application tracking with pipeline stages (Applied → Screening → Interview → Offer → Hired/Rejected), and AI-powered resume scoring |
| **🎯 Performance Management** | Goal setting (Individual/Team/Company), review cycles (Mid-Year/Annual), 360-degree reviews, and aggregate performance scoring |
| **📚 Learning & Development** | Course catalog, employee enrollments, progress tracking, and certificate management |
| **💰 Compensation** | Salary and bonus records with effective dating, multi-currency support, and historical tracking |
| **📊 HR Analytics** | Real-time dashboard with headcount metrics, departmental breakdowns, recruitment pipeline analytics, and goal completion rates |
| **🏢 Department Management** | Hierarchical org structure with department heads, cost centers, and location tracking |

### Platform Capabilities

- **Role-Based Access Control (RBAC)** — 5 roles with granular permissions: `SUPER_ADMIN`, `HR_ADMIN`, `HR_MANAGER`, `DEPT_MANAGER`, `EMPLOYEE`
- **AI Resume Screening** — Automated resume parsing and JD-matching using OpenAI (gpt-4o-mini) with fallback heuristic scoring
- **Audit Logging** — Every authenticated mutation is automatically logged with user, action, entity, old/new values, and IP
- **Secure Session Management** — Refresh tokens stored via httpOnly cookies, sessions tracked in database with expiry
- **Input Validation** — All API inputs validated with Zod schemas before reaching the service layer
- **Rate Limiting** — Configurable rate limiting on authentication endpoints to prevent brute-force attacks

---

## 🏗 Architecture

TalentOS follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│    React 18 · TypeScript · React Router · React Query   │
│             Vite Dev Server (port 5173)                 │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API (JSON)
┌──────────────────────▼──────────────────────────────────┐
│                  APPLICATION LAYER                      │
│  Express 4 · TypeScript · JWT Auth · Zod Validation     │
│  Helmet.js · Rate Limiting · Morgan · Multer            │
│              API Server (port 5000)                     │
└──────────────────────┬──────────────────────────────────┘
                       │  Prisma ORM
┌──────────────────────▼──────────────────────────────────┐
│                     DATA LAYER                          │
│     PostgreSQL 16 (Primary) · Redis 7 (Cache/Queue)     │
│            Docker Compose Infrastructure                │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
talent-management-system/
├── backend/                    # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Complete data model (15+ models)
│   │   ├── migrations/         # Auto-generated DB migrations
│   │   └── seed.ts             # Demo data seeder
│   └── src/
│       ├── config/             # Database, Redis, env configuration
│       ├── middlewares/        # Auth, RBAC, rate-limit, validation, audit
│       ├── modules/
│       │   ├── auth/           # Register, login, refresh, logout
│       │   ├── employees/      # Employee CRUD
│       │   ├── recruitment/    # Jobs, applications, interviews
│       │   ├── performance/    # Goals, review cycles, reviews
│       │   ├── learning/       # Courses, enrollments
│       │   ├── compensation/   # Salary and bonus records
│       │   ├── analytics/      # Dashboard aggregations
│       │   └── admin/          # Department management
│       ├── services/           # Shared business logic
│       ├── utils/              # Helpers (PDF, OpenAI, etc.)
│       └── types/              # TypeScript definitions
├── frontend/                   # Vite + React SPA
│   └── src/
│       ├── app/                # Redux store, root setup
│       ├── components/         # Shared UI components
│       ├── features/           # Feature modules
│       │   ├── auth/           # Login, registration flows
│       │   ├── dashboard/      # Role-aware dashboard
│       │   ├── employees/      # Employee directory
│       │   ├── recruitment/    # Job listings, ATS board
│       │   ├── performance/    # Goals, reviews
│       │   └── analytics/      # Charts and KPIs
│       ├── layouts/            # Dashboard, Auth layouts
│       ├── lib/                # API client, utilities
│       ├── router/             # Route definitions
│       ├── styles/             # Global CSS
│       └── types/              # Shared TypeScript interfaces
├── cypress/                    # E2E test suite
├── docs/                       # API documentation
├── docker-compose.yml          # PostgreSQL + Redis + App services
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
└── package.json                # Monorepo root (npm workspaces)
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Routing** | React Router v6 | Client-side routing with lazy loading |
| **Server State** | TanStack React Query v5 | Data fetching, caching, and synchronization |
| **Backend** | Node.js 20 LTS + Express 4 | REST API server with async I/O |
| **Language** | TypeScript 5.5 | End-to-end type safety |
| **ORM** | Prisma 5 | Type-safe database access with auto-migrations |
| **Database** | PostgreSQL 16 | ACID-compliant relational database |
| **Cache** | Redis 7 | Session caching, rate limiting, job queues |
| **Auth** | JWT + bcrypt | Stateless authentication with password hashing (12 rounds) |
| **Validation** | Zod | Runtime schema validation on all API inputs |
| **Security** | Helmet.js + express-rate-limit | HTTP security headers and brute-force protection |
| **File Upload** | Multer | Resume and document uploads (5MB limit) |
| **AI** | OpenAI API (gpt-4o-mini) | Resume parsing and JD match scoring |
| **Queue** | BullMQ + IORedis | Background job processing |
| **Testing** | Vitest + Supertest + Cypress | Unit, integration, and E2E testing |
| **Containerization** | Docker Compose | Local infrastructure orchestration |
| **CI/CD** | GitHub Actions | Automated lint, test, and build pipeline |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20 LTS
- **Docker** & **Docker Compose**
- **npm** ≥ 9

### 1. Clone & Configure

```bash
git clone <repository-url>
cd talent-management-system

# Create your environment file
cp .env.example .env
```

Edit `.env` to set your secrets (JWT keys, optional OpenAI key for AI features):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tms
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<generate-a-256-bit-random-string>
JWT_REFRESH_SECRET=<generate-a-256-bit-random-string>
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=                  # Optional — enables AI resume parsing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure

```bash
docker compose up -d postgres redis
```

This starts PostgreSQL 16 and Redis 7 with health checks and persistent volumes.

### 4. Initialize the Database

```bash
# Generate the Prisma client
npm run db:generate

# Run migrations
cd backend
npx prisma migrate dev --name init

# Seed with demo data
npm run prisma:seed
cd ..
```

### 5. Start Development Servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:5000 |

### 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | `hr.admin@tms.local` | `Password123!` |
| Department Manager | `manager@tms.local` | `Password123!` |
| Employee | `employee@tms.local` | `Password123!` |

### Docker (Full Stack)

To run the entire stack in containers:

```bash
docker compose up -d
```

This launches all four services — PostgreSQL, Redis, backend, and frontend — with health-check dependencies.

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`. Authenticated routes require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Register a new user account |
| `POST` | `/api/v1/auth/login` | Public | Login and receive access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Cookie | Refresh the access token using httpOnly cookie |
| `DELETE` | `/api/v1/auth/logout` | Bearer | Invalidate the current session |
| `GET` | `/api/v1/auth/me` | Bearer | Get the authenticated user's profile |

### Employees

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/employees` | Bearer | List employees with pagination and filters |
| `GET` | `/api/v1/employees/:id` | Bearer | Get employee details |
| `POST` | `/api/v1/employees` | HR Admin | Create a new employee record |
| `PATCH` | `/api/v1/employees/:id` | HR Admin | Update employee information |

### Recruitment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/jobs` | Public | List all open job postings |
| `POST` | `/api/v1/jobs` | HR Admin | Create a new job requisition |
| `POST` | `/api/v1/jobs/:id/apply` | Public | Submit a job application with resume |
| `GET` | `/api/v1/applications` | HR Manager | List applications with pipeline stage |
| `PATCH` | `/api/v1/applications/:id/stage` | HR Manager | Move applicant through pipeline stages |
| `POST` | `/api/v1/applications/:id/parse` | HR Manager | Trigger AI resume parse & match scoring |

### Performance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/goals` | Bearer | Create a personal/team goal |
| `GET` | `/api/v1/goals` | Bearer | List goals (filtered by employee/team) |
| `POST` | `/api/v1/review-cycles` | HR Admin | Create a new review cycle |
| `POST` | `/api/v1/reviews` | Bearer | Submit a review (self/peer/manager) |
| `GET` | `/api/v1/reviews/360/:empId` | Manager | Get 360-degree review aggregate scores |

### Learning & Development

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/courses` | Bearer | Browse the course catalog |
| `POST` | `/api/v1/enrollments` | Bearer | Enroll in a course |

### Compensation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/compensation/:empId` | HR Admin | View compensation history |
| `POST` | `/api/v1/compensation` | HR Admin | Add a compensation record |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/analytics/dashboard` | Bearer | Aggregated dashboard KPIs and metrics |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/departments` | Bearer | List all departments |
| `POST` | `/api/v1/departments` | HR Admin | Create a new department |

### Response Format

All responses follow a consistent structure:

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "totalPages": 5, "total": 100 }
}

// Error
{
  "success": false,
  "error": { "code": "EMP_NOT_FOUND", "message": "Employee not found" }
}
```

---

## 🗄 Database Schema

The database is managed via **Prisma ORM** with PostgreSQL 16. The schema contains **15+ models** covering the full HR data domain.

### Entity Relationship Overview

```
┌──────────┐    1:1    ┌────────────┐    M:1    ┌──────────────┐
│   User   │◄────────►│  Employee   │─────────►│  Department   │
│          │           │            │           │  (Recursive)  │
└──────────┘           └────────────┘           └──────────────┘
     │                   │  │  │  │
     │                   │  │  │  └─── M ──► Compensation
     │                   │  │  └────── M ──► Enrollment ◄── M ── Course
     │                   │  └───────── M ──► Goal
     │                   └──────────── M ──► Review ◄── M ── ReviewCycle
     │
     ├── M ──► Session
     ├── M ──► AuditLog
     └── M ──► Notification

┌────────────┐    M:1    ┌───────────────┐
│ Application │─────────►│  JobPosting    │
│ (Pipeline)  │          │               │
└────────────┘           └───────────────┘
      │
      └── M ──► Interview
```

### Key Models

| Model | Description |
|-------|-------------|
| `User` | Authentication identity with email, password hash, role, and active status |
| `Employee` | HR profile with emp code, department, manager, skills, hire date, and soft-delete support |
| `Department` | Org unit with recursive hierarchy (parent departments), head assignment, and location |
| `JobPosting` | Job requisition with JD text, required skills, openings count, and lifecycle status |
| `Application` | Applicant record with resume, AI match score, extracted skills, and pipeline stage |
| `Interview` | Scheduled interview with interviewer assignment, feedback (JSON), and verdict |
| `Goal` | Employee goals with type (Individual/Team/Company), progress tracking, and status |
| `ReviewCycle` | Configurable review periods (Mid-Year/Annual) with start/end dates |
| `Review` | Individual review submissions with type (Self/Peer/Manager), ratings (JSON), and comments |
| `Course` | Learning catalog entries with duration, level, skills, and mandatory flag |
| `Enrollment` | Employee-course junction with completion tracking, score, and certificates |
| `Compensation` | Salary records with effective dating, base/bonus amounts, and currency |
| `AuditLog` | Immutable log of every mutation with user, entity, old/new values, and IP |
| `Notification` | In-app notification system with read status and metadata |
| `Session` | Refresh token sessions with hashed tokens and expiry tracking |

### Schema Patterns

- **Soft Deletes** — `deletedAt` timestamp on major entities; records are never hard-deleted
- **JSONB Columns** — Flexible storage for interview feedback, review ratings, and notification metadata
- **Indexed Fields** — B-tree indexes on foreign keys, status columns, and frequently filtered fields
- **Cascading Deletes** — Configured per-relation to maintain referential integrity
- **Unique Constraints** — On employee-course enrollment pairs, user emails, and emp codes

---

## 🔒 Security

Security is implemented at every layer, addressing **OWASP Top 10** risks:

| Control | Implementation |
|---------|---------------|
| **Authentication** | JWT access tokens (15 min TTL) + refresh tokens (7 day TTL) in httpOnly, SameSite=Strict cookies |
| **Password Storage** | bcrypt with 12 salt rounds — never stored in plaintext |
| **RBAC Middleware** | Role-based guards on every protected route with 5 permission levels |
| **Input Validation** | All request bodies validated with Zod schemas before processing |
| **SQL Injection Prevention** | Prisma ORM with parameterized queries — zero raw string interpolation |
| **HTTP Security Headers** | Helmet.js applies X-Content-Type-Options, X-Frame-Options, HSTS, and CSP |
| **Rate Limiting** | express-rate-limit on auth endpoints to prevent brute-force attacks |
| **CORS** | Strict origin allowlist — no wildcard `*` in production |
| **File Upload Safety** | MIME type validation + configurable max size limit (default 5MB) |
| **Secrets Management** | All credentials via environment variables — never committed to source control |
| **Audit Trail** | Every authenticated write operation logged with user, action, old/new values, and IP |

---

## ⚙️ CI/CD

The project includes a **GitHub Actions** workflow that runs on every push and pull request:

```yaml
Pipeline Steps:
  ✓ Checkout code
  ✓ Setup Node.js 20 with npm cache
  ✓ Install dependencies (npm ci)
  ✓ Generate Prisma client
  ✓ TypeScript type-checking (both workspaces)
  ✓ Run unit tests (Vitest)
  ✓ Production build (backend + frontend)
```

### Running Locally

```bash
# Type-check both workspaces
npm run lint

# Run all tests
npm test

# Production build
npm run build

# E2E tests (requires running app)
npm run test:e2e
```

---

## 🗺 Roadmap

- [ ] **AI Enhancements** — Replace heuristic resume parser with full OpenAI-backed structured extraction and skill-gap analysis
- [ ] **Employee Onboarding** — Digital checklists, document collection, and department assignment workflows
- [ ] **Learning Paths** — AI-recommended courses based on performance reviews and career goals
- [ ] **Compensation Module** — Salary bands, CTC breakdowns, and pay equity analytics
- [ ] **Succession Planning** — High-potential tagging, talent pools, and leadership pipeline scoring
- [ ] **Advanced Analytics** — Custom report builder with export (CSV/Excel/PDF) and scheduled email delivery
- [ ] **Redis Queues** — BullMQ workers for async email delivery, report generation, and AI processing
- [ ] **Real-Time Notifications** — Redis Pub/Sub + Server-Sent Events for in-app alerts
- [ ] **Frontend CRUD Flows** — Full create/edit forms for employees, jobs, applications, and goals
- [ ] **E2E Test Coverage** — Cypress test suite for critical user flows (login, apply, review, analytics)

---

## 📄 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret key for signing refresh tokens |
| `ACCESS_TOKEN_TTL_MINUTES` | — | `15` | Access token expiry in minutes |
| `REFRESH_TOKEN_TTL_DAYS` | — | `7` | Refresh token expiry in days |
| `PORT` | — | `5000` | Backend server port |
| `NODE_ENV` | — | `development` | Environment mode |
| `CORS_ORIGIN` | ✅ | — | Allowed frontend origin |
| `PUBLIC_BACKEND_URL` | — | `http://localhost:5000` | Public-facing backend URL |
| `LOCAL_UPLOAD_DIR` | — | `backend/uploads` | Local file upload directory |
| `MAX_RESUME_UPLOAD_SIZE_MB` | — | `5` | Maximum resume file size |
| `OPENAI_API_KEY` | — | — | OpenAI API key (enables AI resume parsing) |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | OpenAI model for resume analysis |
| `ENABLE_BACKGROUND_JOBS` | — | `true` | Enable BullMQ background workers |

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend dev server |
| `npm run build` | Build both workspaces for production |
| `npm run lint` | Run TypeScript type-checking on all workspaces |
| `npm test` | Run unit and integration tests |
| `npm run test:e2e` | Run Cypress E2E tests (headless) |
| `npm run test:e2e:open` | Open Cypress interactive test runner |
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:seed` | Seed the database with demo data |

---

<div align="center">

**Built with ❤️ using Node.js, React, PostgreSQL, and TypeScript**

</div>
