# HR SaaS — Backend (Phase 1)

Node.js + Express + MySQL API implementing Phase 1: authentication,
company registration, roles/permissions, and the base multi-tenant
architecture.

## Setup

```bash
cd backend
cp .env.example .env        # then edit DB credentials + JWT secrets
npm install
```

Create the database schema and seed roles/permissions:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
npm run seed:admin           # creates the bootstrap Super Admin safely
```

Run the API:

```bash
npm run dev      # nodemon, auto-restarts on change
# or
npm start
```

The API listens on `http://localhost:5000` by default; all routes are
namespaced under `/api`.

## Phase 1 + Phase 2 endpoints

| Method | Route                              | Auth                     | Description                                     |
|--------|--------------------------------------|--------------------------|--------------------------------------------------|
| POST   | `/api/auth/register-company`        | Public                   | Registers a company + its first Admin            |
| POST   | `/api/auth/login`                    | Public                   | Login, returns access + refresh tokens           |
| POST   | `/api/auth/refresh`                  | Public                   | Rotates refresh token, issues new access         |
| POST   | `/api/auth/logout`                    | Public                   | Revokes a refresh token                          |
| GET    | `/api/auth/verify-email`             | Public (token)           | Verifies email via emailed token                 |
| POST   | `/api/auth/forgot-password`          | Public                   | Sends password reset email                       |
| POST   | `/api/auth/reset-password`           | Public (token)           | Sets a new password                              |
| GET    | `/api/auth/me`                       | Bearer token             | Current user + roles + permissions               |
| GET    | `/api/companies/me`                   | Bearer token             | The authenticated user's own company             |
| PUT    | `/api/companies/me`                   | company_admin            | Update own company settings                      |
| GET    | `/api/companies`                       | super_admin              | List/search every company on the platform        |
| GET    | `/api/companies/:id`                  | super_admin              | View any company                                 |
| PATCH  | `/api/companies/:id/status`           | super_admin              | Suspend/activate/cancel a company                |
| GET    | `/api/users`                           | company_admin/manager*   | List users in your own company                   |
| GET    | `/api/users/:id`                       | company_admin/manager*   | View one user in your own company                |
| POST   | `/api/users/invite`                   | company_admin/manager*   | Invite a Manager/Employee/Admin into your company|
| PUT    | `/api/users/:id/roles`                | company_admin            | Replace a user's role set                        |
| POST   | `/api/users/:id/permissions`          | company_admin            | Grant one extra permission to a user              |
| DELETE | `/api/users/:id/permissions`          | company_admin            | Revoke a directly-granted permission              |
| PATCH  | `/api/users/:id/status`               | company_admin/manager*   | Activate / suspend a user                         |
| GET    | `/api/roles`                           | company_admin/super_admin| Catalog of assignable roles                       |
| GET    | `/api/permissions`                    | company_admin/super_admin| Full permission catalog                           |
| GET    | `/api/platform/stats`                 | super_admin              | Platform-wide company/user counts                 |
| GET    | `/api/platform/audit-logs`            | super_admin              | Platform-wide audit log search                    |
| GET    | `/api/departments`                     | any company user         | List departments                                  |
| POST   | `/api/departments`                     | company_admin/manager*   | Create a department                               |
| PUT    | `/api/departments/:id`                 | company_admin/manager*   | Update a department                               |
| DELETE | `/api/departments/:id`                 | company_admin/manager*   | Archive a department                              |
| GET    | `/api/positions`                       | any company user         | List positions                                    |
| POST   | `/api/positions`                       | company_admin/manager*   | Create a position                                 |
| PUT    | `/api/positions/:id`                   | company_admin/manager*   | Update a position                                 |
| DELETE | `/api/positions/:id`                   | company_admin/manager*   | Archive a position                                |
| GET    | `/api/employees`                       | company_admin/manager*   | Search/filter/sort/paginate employees             |
| POST   | `/api/employees`                       | company_admin/manager*   | Add an employee                                   |
| GET    | `/api/employees/:id`                   | company_admin/manager*   | View an employee                                  |
| PUT    | `/api/employees/:id`                   | company_admin/manager*   | Update an employee                                |
| PATCH  | `/api/employees/:id/status`            | company_admin/manager*   | Change employment status                          |
| DELETE | `/api/employees/:id`                   | company_admin/manager*   | Deactivate (soft-delete) an employee              |
| GET    | `/api/employees/:id/history`           | company_admin/manager*   | Audit trail for one employee                      |
| GET    | `/api/employees/me`                    | any authenticated user   | The caller's own employee profile                 |
| PUT    | `/api/employees/me`                    | any authenticated user   | Self-service update (contact info only)           |
| GET    | `/api/employees/me/team`               | manager/company_admin    | The caller's direct reports                       |
| GET    | `/api/employees/stats/department-distribution` | company_admin/manager | Headcount per department for dashboards   |
| POST   | `/api/attendance/clock-in`             | any authenticated user   | Clock in for today (auto-detects "late")          |
| POST   | `/api/attendance/clock-out`            | any authenticated user   | Clock out for today, computes hours worked        |
| GET    | `/api/attendance/me/today`             | any authenticated user   | Today's attendance record                         |
| GET    | `/api/attendance/me/history`           | any authenticated user   | Own attendance history, paginated                 |
| GET    | `/api/attendance/me/summary`           | any authenticated user   | Total hours worked over a date range              |
| GET    | `/api/attendance/team`                 | manager/company_admin    | Direct reports' attendance for a given date       |
| GET    | `/api/attendance`                       | company_admin/manager*   | Company-wide attendance, filterable/paginated     |
| GET    | `/api/attendance/late`                 | company_admin/manager*   | Employees marked late for a given date            |
| GET    | `/api/attendance/absent`               | company_admin/manager*   | Active employees with no record for a given date  |
| GET    | `/api/attendance/stats/today`          | company_admin/manager*   | Present/late/absent/on-leave/avg-hours snapshot   |
| GET    | `/api/leave/types`                     | any company user         | List configurable leave types                     |
| POST   | `/api/leave/types`                     | company_admin/manager*   | Create a leave type                               |
| PUT    | `/api/leave/types/:id`                 | company_admin/manager*   | Update a leave type                               |
| DELETE | `/api/leave/types/:id`                 | company_admin/manager*   | Archive a leave type                              |
| GET    | `/api/leave/balances/me`               | any authenticated user   | Own leave balances for a year                     |
| POST   | `/api/leave/requests`                  | any authenticated user   | Submit a leave request                            |
| GET    | `/api/leave/requests/me`               | any authenticated user   | Own leave request history                         |
| PATCH  | `/api/leave/requests/:id/cancel`       | any authenticated user   | Cancel a pending request                          |
| GET    | `/api/leave/requests/team`             | manager/company_admin    | Direct reports' leave requests                    |
| GET    | `/api/leave/requests`                   | company_admin/manager*   | Company-wide leave requests, filterable           |
| GET    | `/api/leave/calendar`                   | company_admin/manager*   | Approved leave within a date range                |
| PATCH  | `/api/leave/requests/:id/approve`       | company_admin/manager*   | Approve a pending request                         |
| PATCH  | `/api/leave/requests/:id/reject`       | company_admin/manager*   | Reject a pending request (reason required)        |
| POST   | `/api/payroll/periods`                 | company_admin/manager*   | Create a payroll period                           |
| GET    | `/api/payroll/periods`                 | company_admin/manager*   | List payroll periods                              |
| GET    | `/api/payroll/periods/:id`             | company_admin/manager*   | View a period + its line items                    |
| POST   | `/api/payroll/periods/:id/calculate`   | company_admin/manager*   | Calculate line items from current salaries         |
| PUT    | `/api/payroll/periods/:payrollId/items/:itemId` | company_admin/manager* | Adjust one employee's allowances/bonuses/deductions/tax |
| POST   | `/api/payroll/periods/:id/review`      | company_admin/manager*   | Mark a calculated period as reviewed              |
| POST   | `/api/payroll/periods/:id/approve`     | company_admin/manager*   | Approve a reviewed period                         |
| POST   | `/api/payroll/periods/:id/process`     | company_admin/manager*   | Mark items paid and generate payslips             |
| GET    | `/api/payroll/payslips/me`             | any authenticated user   | Own payslips                                       |
| GET    | `/api/payroll/payslips/me/:id`         | any authenticated user   | One payslip's detail                              |
| GET    | `/api/payroll/salary-history/me`       | any authenticated user   | Own salary history across periods                 |
| GET    | `/api/recruitment/public/:companySlug/jobs` | Public               | List published jobs for a company                 |
| GET    | `/api/recruitment/public/:companySlug/jobs/:jobSlug` | Public       | View one published job                            |
| POST   | `/api/recruitment/public/:companySlug/jobs/:jobSlug/apply` | Public | Submit an application — no account required        |
| POST   | `/api/recruitment/jobs`                | company_admin/manager*   | Create a job posting (draft)                      |
| GET    | `/api/recruitment/jobs`                | company_admin/manager*   | List job postings                                 |
| PUT    | `/api/recruitment/jobs/:id`            | company_admin/manager*   | Update a job posting                              |
| POST   | `/api/recruitment/jobs/:id/publish`    | company_admin/manager*   | Publish a job posting                             |
| POST   | `/api/recruitment/jobs/:id/close`      | company_admin/manager*   | Close a job posting                               |
| GET    | `/api/recruitment/applications`        | company_admin/manager*   | List applications, filterable by job/status       |
| PATCH  | `/api/recruitment/applications/:id/status` | company_admin/manager* | Move an applicant through the pipeline            |
| PUT    | `/api/recruitment/applications/:id/notes` | company_admin/manager* | Save internal review notes                        |
| POST   | `/api/recruitment/applications/:id/interviews` | company_admin/manager* | Schedule an interview                        |
| PUT    | `/api/recruitment/interviews/:id`      | company_admin/manager*   | Update interview notes/status                     |
| POST   | `/api/performance/goals`               | company_admin/manager*   | Create a goal + KPI for an employee               |
| GET    | `/api/performance/goals`               | company_admin/manager*   | List goals (scoped — see notes below)             |
| PUT    | `/api/performance/goals/:id`           | company_admin/manager*   | Edit a goal                                        |
| PATCH  | `/api/performance/goals/:id/progress`  | company_admin/manager*   | Update progress % / status                        |
| DELETE | `/api/performance/goals/:id`           | company_admin/manager*   | Archive a goal                                     |
| GET    | `/api/performance/goals/me`            | any authenticated user   | Own goals                                          |
| POST   | `/api/performance/reviews`             | company_admin/manager*   | Create a review (draft)                            |
| GET    | `/api/performance/reviews`             | company_admin/manager*   | List reviews (scoped — see notes below)            |
| PUT    | `/api/performance/reviews/:id`         | company_admin/manager*   | Edit rating/feedback while draft/in_progress        |
| POST   | `/api/performance/reviews/:id/start`   | company_admin/manager*   | draft → in_progress                                |
| POST   | `/api/performance/reviews/:id/submit`  | company_admin/manager*   | in_progress → submitted (rating+feedback required)  |
| POST   | `/api/performance/reviews/:id/complete`| company_admin/manager*   | reviewed → completed                               |
| GET    | `/api/performance/reviews/me`          | any authenticated user   | Own reviews (only submitted/reviewed/completed)     |
| POST   | `/api/performance/reviews/:id/acknowledge` | any authenticated user | submitted → reviewed, with optional comments    |
| POST   | `/api/documents`                       | company_admin/manager*   | Upload a document for an employee (multipart)     |
| GET    | `/api/documents`                       | company_admin/manager*   | List documents, filterable by employee/type       |
| GET    | `/api/documents/me`                    | any authenticated user   | Own documents                                     |
| GET    | `/api/documents/:id/download`           | owner or staff            | Stream the file (never a public URL)              |
| DELETE | `/api/documents/:id`                   | company_admin/manager*   | Remove a document                                 |
| GET    | `/api/notifications`                   | any authenticated user   | Own notifications, paginated                      |
| GET    | `/api/notifications/unread-count`      | any authenticated user   | Unread count for the bell icon                    |
| PATCH  | `/api/notifications/:id/read`          | any authenticated user   | Mark one notification read                        |
| PATCH  | `/api/notifications/read-all`          | any authenticated user   | Mark all notifications read                       |
| GET    | `/api/announcements`                    | any company user         | List announcements                                |
| POST   | `/api/announcements`                   | company_admin/manager*   | Publish an announcement (notifies everyone)       |
| PUT    | `/api/announcements/:id`               | company_admin/manager*   | Edit an announcement                              |
| DELETE | `/api/announcements/:id`               | company_admin/manager*   | Remove an announcement                            |
| GET    | `/api/reports/employees`               | company_admin/manager*   | Employee report (JSON or `?format=csv`)           |
| GET    | `/api/reports/attendance`              | company_admin/manager*   | Attendance report over a date range                |
| GET    | `/api/reports/leave`                   | company_admin/manager*   | Leave report                                       |
| GET    | `/api/reports/payroll`                 | company_admin/manager*   | Payroll report for one period (`?payrollId=`)      |
| GET    | `/api/reports/recruitment`             | company_admin/manager*   | Recruitment pipeline report                        |
| GET    | `/api/reports/performance`             | company_admin/manager*   | Performance goals/reviews report                   |
| GET    | `/api/audit-logs`                      | company_admin              | Company's own audit trail (distinct from platform-wide) |
| GET    | `/api/dashboard/admin`                 | company_admin              | Admin dashboard aggregate stats                    |
| GET    | `/api/dashboard/manager`               | manager/company_admin      | Manager dashboard aggregate stats                  |
| GET    | `/api/dashboard/employee`              | any authenticated user     | Employee dashboard aggregate stats                 |

\* Manager requires the corresponding permission (`employees:manage`,
`departments:manage`, `positions:manage`, `attendance:manage`,
`leave:manage`, `payroll:manage`, `recruitment:manage`,
`documents:manage`, `announcements:manage`, or `reports:view`) to be
explicitly granted (see below). **Performance is the one exception** — see notes
below.

## Architecture notes

- **Multi-tenancy**: `companyMiddleware` derives `req.companyId` solely
  from the authenticated JWT session and strips any client-supplied
  `company_id`/`companyId` from request bodies. Every company-scoped
  query must filter by `req.companyId`, never a value from the client.
  `userModel.listByCompany` / `findByIdAndCompany` demonstrate the
  pattern every future module (employees, attendance, leave, ...)
  should follow.
- **RBAC**: `roleMiddleware` gates by role slug (`super_admin`,
  `company_admin`, `manager`, `employee`); `permissionMiddleware` gates
  by fine-grained permission slug and lets a Company Admin grant a
  Manager extra capability without changing their role. Phase 2 adds
  the `user_permissions` table plus `POST/DELETE /api/users/:id/permissions`
  so that grant/revoke is a real, auditable action, not just middleware
  logic with nothing behind it.
- **Company Admin self-service team management**: `POST /api/users/invite`
  creates a user directly inside the caller's own company (company_id is
  never accepted from the client), assigns roles, and emails a
  set-password link reusing the password-reset flow rather than a
  separate one.
- **Super Admin platform view**: `/api/companies` (list/search),
  `/api/platform/stats`, and `/api/platform/audit-logs` implement the
  "View all companies" / "View system-wide statistics" / "View audit
  logs" capabilities from spec Section 1.
- **Employee management (Phase 3)**: `employees`, `departments`, and
  `positions` tables all carry `company_id` and every query is scoped
  through `req.companyId`. Cross-entity integrity is enforced in
  `employeeService.assertRelationsBelongToCompany` — a department,
  position, or manager can only be attached to an employee if it
  belongs to the SAME company, closing a subtle multi-tenant leak
  vector (e.g. guessing another tenant's department id).
  `employeeModel.listByCompany` implements search + filter (department,
  position, manager, status) + sort + pagination in one query. Soft
  deletion (`deactivateEmployee`) preserves history rather than hard
  deleting, matching the spec's "Deactivate employee" / "Employee
  history" features — history is served from the existing `audit_logs`
  table via `GET /api/employees/:id/history`.
- **Self-service vs. admin management**: `PUT /api/employees/me` only
  allows an employee to edit a safe allowlist of their own fields
  (phone, address, emergency contact, photo) — department, position,
  salary, manager, and status stay admin-only via `PUT /api/employees/:id`.
- **Attendance (Phase 4)**: `attendance_records` carries one row per
  employee per calendar day and already has nullable
  `clock_in_lat/lng` / `clock_out_lat/lng` columns, so GPS/location
  attendance (spec Section 7) can be enabled later purely in the
  application layer with zero schema migration. "Late" is computed
  server-side in `attendanceService.isLate` against the company's
  configured `working_hours_start` + a 15-minute grace period — never
  trusted from the client. "Absent" is never stored as a row; it's
  derived at query time as active employees minus those with a record
  for the date (`attendanceModel.listAbsentForDate`), so a missing
  clock-in is always accurate without a nightly batch job. Manager
  team views (`/api/attendance/team`) resolve the manager's own
  employee record from their `req.user.id`, then scope strictly to
  their `manager_id` direct reports — never a client-supplied id.
- **Leave management (Phase 5)**: Default leave types (Annual, Sick,
  Emergency, Maternity, Paternity, Unpaid, Other) are seeded per
  company inside the same transaction as company registration
  (`authService.registerCompanyWithAdmin`), then Company Admins can
  add/edit/archive their own beyond that. `leave_balances` rows are
  created lazily — the first time a balance is looked up or a request
  is submitted for a given (employee, leave type, year) — so adding a
  new leave type never needs a backfill migration. Balance days are
  deducted from `used_days` only at APPROVAL time, not submission, so
  a rejected or cancelled request never needs a rollback; a second
  balance check re-runs at approval time in case circumstances changed
  between submission and review. `leaveRequestModel.findOverlapping`
  blocks a second pending/approved request over the same dates.
  Unpaid-type leave (`is_paid = false` or `default_days_per_year = 0`)
  skips balance enforcement entirely.
- **Payroll (Phase 6)**: A payroll run (`payroll`) moves through
  `draft -> calculated -> reviewed -> approved -> processed`, and each
  transition is its own guarded, auditable service call
  (`calculatePeriod`, `markReviewed`, `approvePeriod`,
  `processPeriod`) rather than one opaque "run payroll" action — spec
  Section 9 calls out create/calculate/review/approve/process as
  distinct HR capabilities. All tax logic lives in exactly one place,
  `payrollService.calculateTax`, so country-specific statutory rules
  (spec: "Design the payroll architecture so country-specific tax and
  statutory rules can be added later") can be swapped in there without
  touching models, controllers, routes, or the schema. Payroll items
  are only editable while `calculated`/`reviewed`; once `approved` the
  numbers are locked before `processPeriod` marks them paid and
  generates `payslips` rows employees can view. Payslips are a
  distinct table from `payroll_items` so a payslip keeps a stable
  identity and generation timestamp even if a correction run later
  adjusts the underlying line item.
- **Recruitment (Phase 7)**: `job_applications` deliberately has no
  foreign key to `users` or `employees` — the spec requires a public
  application page that "does not require the applicant to have an
  employee account," so an applicant is data, not a platform identity.
  The public routes (`/api/recruitment/public/:companySlug/...`) sit
  outside `authMiddleware`/`companyMiddleware` entirely and resolve the
  company from its slug instead of a token, with their own rate
  limiter since they accept anonymous traffic. A closed or draft job
  posting is invisible on the public routes even if someone guesses
  its slug (`jobPostingModel.findPublishedBySlug` filters on
  `status = 'published'`). Scheduling an interview automatically
  advances a fresh application out of `applied`/`screening` into the
  `interview` pipeline stage, matching how the stages are meant to
  flow in practice rather than requiring a separate manual step.
- **Performance (Phase 8)**: unlike every other module, a plain
  Manager does NOT need an explicit permission grant to manage
  performance for their own team — spec Section 11 treats "Managers
  and HR" as having this capability by default, and gating it behind
  an opt-in permission would contradict that. Instead,
  `performanceService.assertCanManageEmployee` checks the data
  relationship directly: Company Admins (or anyone with
  `performance:manage`) can touch any employee, while a Manager is
  only allowed to touch employees whose `manager_id` matches their own
  employee record — checked fresh on every request, not cached in the
  JWT. `listGoals`/`listReviews` apply the same scoping when no
  specific employee is requested, so a Manager's list view is silently
  restricted to their own reports rather than erroring. A review is
  invisible to the employee (`listVisibleForEmployee`) while
  `draft`/`in_progress` — only once a Manager explicitly `submit`s it
  does the employee see it and get a chance to `acknowledge` it with
  their own comments, closing the loop from Draft through Completed.
- **Documents (Phase 9)**: uploaded files are written to
  `backend/uploads/documents/` under a randomly generated filename via
  `multer.diskStorage` — the original filename is preserved only in
  the `documents.original_filename` column, never used as the on-disk
  path. That directory is never mounted with `express.static` and has
  no public route; the only way to read a file back out is
  `GET /api/documents/:id/download`, which re-authenticates and
  re-authorizes on every single request in
  `documentService.resolveDownload` (staff with `documents:manage`, or
  the document's own employee) before streaming bytes — there is no
  stored URL to leak in the first place, satisfying the spec's "Use
  secure file access. Do not expose private document storage URLs
  publicly."
- **Notifications (Phase 9)**: `notificationService` centralizes
  recipient resolution (`notifyEmployee`, `notifyManagerOf`,
  `notifyCompanyAdmins`, `notifyAllCompanyUsers`) and is called from
  the *existing* Phase 4–8 services at the exact points the spec lists
  in Section 13 — leave submitted/approved/rejected, a new document
  uploaded, payroll processed, a performance review submitted, a new
  recruitment application, and a published announcement — rather than
  bolting notification logic onto controllers after the fact.
- **Announcements (Phase 9)**: creating an announcement fans out a
  notification to every active user in the company via
  `notifyAllCompanyUsers`, so "Company announcements" (spec Section
  13's notification list) and the announcement feed itself
  (spec Section 14) share one code path instead of two.
- **Reports (Phase 10)**: every report endpoint reuses the exact same
  model functions (and therefore the exact same company-scoping) that
  their originating modules already use — `reportService.employeeReport`
  calls `employeeModel.listByCompany`, `attendanceReport` calls
  `attendanceModel.listByCompany`, and so on. Nothing new is queried
  directly against the database; a report can never drift from what
  its module's own list view shows. `GET .../format=csv` and the
  default JSON response are served from the identical dataset —
  `reportController.respond` just chooses the serialization
  (`utils/csv.js`, a small dependency-free CSV writer with standard
  quote/comma/newline escaping) — so there is no risk of the CSV
  export and the on-screen table disagreeing.
- **Audit logs, two views (Phase 2 + Phase 10)**: `/api/platform/audit-logs`
  (Phase 2, super_admin only) can see every company; the new
  `/api/audit-logs` (Phase 10, company_admin only) hard-codes
  `companyId: req.companyId` into the query and never accepts a
  company id from the client, so a Company Admin can only ever see
  their own company's trail even though the underlying `auditLogModel.list`
  function is shared by both routes.
- **Dashboards (spec Section 15)**: `dashboardService` has one function
  per role (`getAdminDashboard`, `getManagerDashboard`,
  `getEmployeeDashboard`), each composing existing model calls rather
  than introducing parallel aggregate tables — e.g. "attendance today"
  reuses `attendanceModel.getStatsForDate` from Phase 4 verbatim. The
  Manager dashboard resolves the caller's own employee record from
  their `req.user.id` exactly like the Phase 4/5/8 "team" endpoints do,
  so a Manager's dashboard is automatically scoped to their own direct
  reports with no separate authorization check needed.
- **Tokens**: Short-lived JWT access tokens (15m default) + rotating
  refresh tokens hashed and stored server-side so logout / compromise
  can revoke them.
- **Passwords**: bcrypt with configurable salt rounds; never hardcode
  hashes — the bootstrap Super Admin is created by `scripts/seedSuperAdmin.js`,
  which hashes at runtime and skips if the account already exists.
- **Audit logging**: `auditLogModel.record()` is called from the
  controllers/services for the sensitive actions in this phase
  (registration, login, settings changes, status changes) and is ready
  to extend into every future module (Section 17 of the spec).

## Next phases

This backend is structured (`controllers/ → services/ → models/`,
plus `middleware/`, `validators/`, `routes/`) so Phase 2 onward
(employees, attendance, leave, payroll, recruitment, performance,
documents, notifications, announcements, reports) can be added as new
files without restructuring what's already here — see `src/routes/index.js`
for where new routers get mounted.
