# TalentOS Backend API Overview

## Current modules

- `auth`: register, login, refresh, logout, current-user lookup
- `employees`: list, detail, create, update
- `recruitment`: jobs, public applications, stage updates, resume parsing
- `performance`: goals, review cycles, review submission, 360 summaries
- `analytics`: dashboard metrics
- `admin`: department management
- `learning`: course catalog and employee enrollments
- `compensation`: employee compensation history and record creation

## Notable implementation details

- Authenticated mutation routes now emit `AuditLog` records.
- Employee onboarding no longer uses a shared hardcoded password; new records receive a generated temporary password in the create response.
- Dashboard analytics use Prisma aggregates and `groupBy` instead of loading every application and goal row into memory.
- Frontend API calls default to `/api/v1` and support Vite proxying through `VITE_API_PROXY_TARGET`.

## Remaining gaps

- Redis, queues, email delivery, and file uploads are still not implemented.
- The generated Prisma migration should be applied with `npm run db:migrate` once PostgreSQL is available.
- Frontend create/edit workflows for employees, jobs, and applications still need to be built.
