CREATE DATABASE IF NOT EXISTS hr_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hr_saas;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(191)      NOT NULL,
  slug                VARCHAR(191)      NOT NULL,
  logo_url            VARCHAR(500)      NULL,
  registration_number VARCHAR(100)      NULL,
  industry            VARCHAR(100)      NULL,
  email               VARCHAR(191)      NOT NULL,
  phone               VARCHAR(50)       NULL,
  address             VARCHAR(500)      NULL,
  country             VARCHAR(100)      NULL,
  currency            VARCHAR(10)       DEFAULT 'USD',
  timezone            VARCHAR(100)      DEFAULT 'UTC',
  working_hours_start TIME              DEFAULT '09:00:00',
  working_hours_end   TIME              DEFAULT '17:00:00',
  status              ENUM('active','suspended','trial','cancelled') NOT NULL DEFAULT 'trial',
  created_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP         NULL,
  UNIQUE KEY uq_companies_slug (slug),
  UNIQUE KEY uq_companies_email (email),
  INDEX idx_companies_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- roles (global catalog: super_admin, company_admin, manager, employee)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL,
  slug        VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  is_system   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_slug (slug)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- permissions (fine-grained capability catalog)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  module      VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_slug (slug),
  INDEX idx_permissions_module (module)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- role_permissions (which permissions a role grants by default)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_permission (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- users (a user belongs to exactly one company, EXCEPT super_admins
-- who have company_id = NULL and manage the whole platform)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id              BIGINT UNSIGNED NULL,
  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  email                   VARCHAR(191) NOT NULL,
  password_hash           VARCHAR(255) NOT NULL,
  phone                   VARCHAR(50)  NULL,
  avatar_url              VARCHAR(500) NULL,
  status                  ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  email_verified_at       TIMESTAMP NULL,
  email_verification_token VARCHAR(255) NULL,
  password_reset_token    VARCHAR(255) NULL,
  password_reset_expires  TIMESTAMP NULL,
  last_login_at           TIMESTAMP NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at               TIMESTAMP NULL,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_company (company_id),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- user_roles (a user can hold one or more roles within their company)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  role_id    BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_role (user_id, role_id),
  INDEX idx_user_roles_company (company_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_tokens_user (user_id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(150) NOT NULL,
  description  VARCHAR(500) NULL,
  manager_id   BIGINT UNSIGNED NULL,   -- FK to employees.id, added after employees exists
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL,
  UNIQUE KEY uq_department_company_name (company_id, name),
  INDEX idx_departments_company (company_id),
  CONSTRAINT fk_departments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NULL,
  title         VARCHAR(150) NOT NULL,
  description   VARCHAR(500) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL,
  UNIQUE KEY uq_position_company_title (company_id, title),
  INDEX idx_positions_company (company_id),
  INDEX idx_positions_department (department_id),
  CONSTRAINT fk_positions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_positions_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- employees
-- An employee record is distinct from a `users` login account: every
-- employee optionally links to one via `user_id` (Managers/Employees
-- who need portal access do; some employee records — e.g. contractors
-- without login access — may not).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id              BIGINT UNSIGNED NOT NULL,
  user_id                 BIGINT UNSIGNED NULL,
  employee_code           VARCHAR(50)  NOT NULL,
  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  profile_photo_url       VARCHAR(500) NULL,
  email                   VARCHAR(191) NOT NULL,
  phone                   VARCHAR(50)  NULL,
  date_of_birth           DATE NULL,
  gender                  ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  address                 VARCHAR(500) NULL,
  emergency_contact_name  VARCHAR(150) NULL,
  emergency_contact_phone VARCHAR(50)  NULL,
  department_id           BIGINT UNSIGNED NULL,
  position_id             BIGINT UNSIGNED NULL,
  manager_id              BIGINT UNSIGNED NULL,  -- self-referencing: another employee
  employment_type         ENUM('full_time', 'part_time', 'contract', 'intern') NOT NULL DEFAULT 'full_time',
  employment_date         DATE NULL,
  salary                  DECIMAL(14,2) NULL,
  employment_status       ENUM('active', 'on_leave', 'suspended', 'resigned', 'terminated') NOT NULL DEFAULT 'active',
  bank_name               VARCHAR(150) NULL,
  bank_account_name       VARCHAR(150) NULL,
  bank_account_number     VARCHAR(100) NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at              TIMESTAMP NULL,
  UNIQUE KEY uq_employee_company_code (company_id, employee_code),
  INDEX idx_employees_company (company_id),
  INDEX idx_employees_department (department_id),
  INDEX idx_employees_position (position_id),
  INDEX idx_employees_manager (manager_id),
  INDEX idx_employees_status (employment_status),
  CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Add the department -> manager FK now that employees exists.
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- attendance_records
-- One row per employee per calendar day. `clock_in_lat/lng` and
-- `clock_out_lat/lng` are nullable now so GPS/location-based attendance
-- (spec Section 7: "Prepare the architecture so GPS/location-based
-- attendance can be added later") can be turned on later purely in the
-- application layer, with no schema migration required.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  employee_id     BIGINT UNSIGNED NOT NULL,
  work_date       DATE NOT NULL,
  clock_in_at     DATETIME NULL,
  clock_out_at    DATETIME NULL,
  clock_in_lat    DECIMAL(10,7) NULL,
  clock_in_lng    DECIMAL(10,7) NULL,
  clock_out_lat   DECIMAL(10,7) NULL,
  clock_out_lng   DECIMAL(10,7) NULL,
  status          ENUM('present', 'late', 'absent', 'on_leave', 'half_day') NOT NULL DEFAULT 'present',
  total_minutes   INT UNSIGNED NULL,
  notes           VARCHAR(500) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_employee_day (employee_id, work_date),
  INDEX idx_attendance_company (company_id),
  INDEX idx_attendance_employee (employee_id),
  INDEX idx_attendance_date (work_date),
  INDEX idx_attendance_status (status),
  CONSTRAINT fk_attendance_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- leave_types
-- Company-configurable (spec: "Create configurable leave types").
-- Defaults (Annual, Sick, Emergency, Maternity, Paternity, Unpaid,
-- Other) are seeded per company at registration time in authService,
-- but Company Admins can add/edit/archive their own beyond that.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_types (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id             BIGINT UNSIGNED NOT NULL,
  name                   VARCHAR(100) NOT NULL,
  description            VARCHAR(500) NULL,
  default_days_per_year  DECIMAL(6,2) NOT NULL DEFAULT 0,
  is_paid                BOOLEAN NOT NULL DEFAULT TRUE,
  requires_document      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at             TIMESTAMP NULL,
  UNIQUE KEY uq_leave_type_company_name (company_id, name),
  INDEX idx_leave_types_company (company_id),
  CONSTRAINT fk_leave_types_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- leave_balances
-- One row per employee, per leave type, per calendar year. Rows are
-- created lazily (on first request or balance lookup) rather than
-- pre-populated for every employee, so adding a new leave type never
-- requires a backfill migration.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_balances (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  employee_id     BIGINT UNSIGNED NOT NULL,
  leave_type_id   BIGINT UNSIGNED NOT NULL,
  year            SMALLINT UNSIGNED NOT NULL,
  allocated_days  DECIMAL(6,2) NOT NULL DEFAULT 0,
  used_days       DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_balance (employee_id, leave_type_id, year),
  INDEX idx_leave_balances_company (company_id),
  CONSTRAINT fk_leave_balances_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_balances_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- leave_requests
-- Balance days are only deducted from leave_balances.used_days at
-- APPROVAL time (not submission), so a rejected or cancelled request
-- never needs a balance rollback.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id              BIGINT UNSIGNED NOT NULL,
  employee_id             BIGINT UNSIGNED NOT NULL,
  leave_type_id           BIGINT UNSIGNED NOT NULL,
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  total_days              DECIMAL(6,2) NOT NULL,
  reason                  VARCHAR(1000) NULL,
  supporting_document_url VARCHAR(500) NULL,
  status                  ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reviewed_by             BIGINT UNSIGNED NULL,
  reviewed_at             TIMESTAMP NULL,
  reviewer_notes          VARCHAR(1000) NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leave_requests_company (company_id),
  INDEX idx_leave_requests_employee (employee_id),
  INDEX idx_leave_requests_status (status),
  INDEX idx_leave_requests_dates (start_date, end_date),
  CONSTRAINT fk_leave_requests_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leave_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- payroll
-- One row per pay period ("payroll run"). Status moves forward through
-- draft -> calculated -> reviewed -> approved -> processed, matching
-- the spec's "Create payroll period / Calculate / Review / Approve /
-- Process payroll" workflow. Each step is a distinct, auditable action
-- rather than a single opaque "run payroll" button.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  pay_date      DATE NOT NULL,
  status        ENUM('draft', 'calculated', 'reviewed', 'approved', 'processed') NOT NULL DEFAULT 'draft',
  notes         VARCHAR(1000) NULL,
  created_by    BIGINT UNSIGNED NULL,
  approved_by   BIGINT UNSIGNED NULL,
  approved_at   TIMESTAMP NULL,
  processed_at  TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_company_period (company_id, period_start, period_end),
  INDEX idx_payroll_company (company_id),
  INDEX idx_payroll_status (status),
  CONSTRAINT fk_payroll_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_payroll_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- payroll_items
-- One row per employee, per payroll run. `tax` is computed by a
-- pluggable calculator (see payrollService.calculateTax) so
-- country-specific statutory rules (spec Section 9: "Design the
-- payroll architecture so country-specific tax and statutory rules can
-- be added later") can be swapped in without a schema change — the
-- column just stores whatever the calculator returned.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  payroll_id      BIGINT UNSIGNED NOT NULL,
  employee_id     BIGINT UNSIGNED NOT NULL,
  basic_salary    DECIMAL(14,2) NOT NULL DEFAULT 0,
  allowances      DECIMAL(14,2) NOT NULL DEFAULT 0,
  bonuses         DECIMAL(14,2) NOT NULL DEFAULT 0,
  deductions      DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax             DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_salary      DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_status  ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  notes           VARCHAR(500) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_item (payroll_id, employee_id),
  INDEX idx_payroll_items_company (company_id),
  INDEX idx_payroll_items_employee (employee_id),
  CONSTRAINT fk_payroll_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_items_payroll FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
  CONSTRAINT fk_payroll_items_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- payslips
-- Generated once a payroll run is processed. Kept as its own table
-- (rather than just reading payroll_items) so a payslip has a stable
-- identity and generation timestamp even if payroll_items are later
-- adjusted for a correction run. `file_url` is nullable for now — PDF
-- generation lands in Phase 12 (Employee Documents) and will populate
-- this column without a schema change.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id        BIGINT UNSIGNED NOT NULL,
  payroll_item_id   BIGINT UNSIGNED NOT NULL,
  employee_id       BIGINT UNSIGNED NOT NULL,
  payroll_id        BIGINT UNSIGNED NOT NULL,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  pay_date          DATE NOT NULL,
  basic_salary      DECIMAL(14,2) NOT NULL,
  allowances        DECIMAL(14,2) NOT NULL,
  bonuses           DECIMAL(14,2) NOT NULL,
  deductions        DECIMAL(14,2) NOT NULL,
  tax               DECIMAL(14,2) NOT NULL,
  net_salary        DECIMAL(14,2) NOT NULL,
  file_url          VARCHAR(500) NULL,
  generated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payslip_item (payroll_item_id),
  INDEX idx_payslips_company (company_id),
  INDEX idx_payslips_employee (employee_id),
  CONSTRAINT fk_payslips_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_payslips_payroll_item FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_payslips_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_payslips_payroll FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- job_postings
-- `slug` + `company_id` forms the public URL (spec: "Create a public
-- job application page that does not require the applicant to have an
-- employee account") — applicants reach a posting via
-- /careers/:companySlug/:jobSlug with no authentication at all.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  department_id   BIGINT UNSIGNED NULL,
  position_id     BIGINT UNSIGNED NULL,
  title           VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) NOT NULL,
  description     TEXT NULL,
  requirements    TEXT NULL,
  location        VARCHAR(200) NULL,
  employment_type ENUM('full_time', 'part_time', 'contract', 'intern') NOT NULL DEFAULT 'full_time',
  status          ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
  posted_by       BIGINT UNSIGNED NULL,
  published_at    TIMESTAMP NULL,
  closed_at       TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  UNIQUE KEY uq_job_postings_company_slug (company_id, slug),
  INDEX idx_job_postings_company (company_id),
  INDEX idx_job_postings_status (status),
  CONSTRAINT fk_job_postings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_postings_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_job_postings_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
  CONSTRAINT fk_job_postings_posted_by FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- job_applications
-- Deliberately has NO foreign key to `users` or `employees` — an
-- applicant is not, and must not be required to become, a platform
-- account holder. `resume_url` is a plain string for now; wiring it to
-- real uploaded storage lands in Phase 12 (Employee Documents) without
-- a schema change here.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id          BIGINT UNSIGNED NOT NULL,
  job_posting_id      BIGINT UNSIGNED NOT NULL,
  applicant_first_name VARCHAR(100) NOT NULL,
  applicant_last_name  VARCHAR(100) NOT NULL,
  applicant_email      VARCHAR(191) NOT NULL,
  applicant_phone       VARCHAR(50) NULL,
  resume_url           VARCHAR(500) NULL,
  cover_letter         TEXT NULL,
  status               ENUM('applied', 'screening', 'interview', 'shortlisted', 'hired', 'rejected') NOT NULL DEFAULT 'applied',
  internal_notes       VARCHAR(2000) NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_applications_company (company_id),
  INDEX idx_job_applications_posting (job_posting_id),
  INDEX idx_job_applications_status (status),
  CONSTRAINT fk_job_applications_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_applications_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interviews (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id         BIGINT UNSIGNED NOT NULL,
  job_application_id BIGINT UNSIGNED NOT NULL,
  scheduled_at       DATETIME NOT NULL,
  method             VARCHAR(100) NULL,
  interviewer_id     BIGINT UNSIGNED NULL,
  notes              TEXT NULL,
  status             ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_interviews_company (company_id),
  INDEX idx_interviews_application (job_application_id),
  CONSTRAINT fk_interviews_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_application FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_interviews_interviewer FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- performance_goals
-- A goal carries its own measurable KPI text/target rather than a
-- separate KPI table — spec Section 11 lists "Create performance
-- goals" and "Assign KPIs" together, and in practice a KPI is just the
-- measurable definition of a goal, not an independent object with its
-- own lifecycle.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performance_goals (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  employee_id      BIGINT UNSIGNED NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      VARCHAR(2000) NULL,
  kpi              VARCHAR(500) NULL,
  target_value     VARCHAR(100) NULL,
  start_date       DATE NULL,
  due_date         DATE NULL,
  status           ENUM('not_started', 'in_progress', 'completed', 'missed') NOT NULL DEFAULT 'not_started',
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_by       BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP NULL,
  INDEX idx_performance_goals_company (company_id),
  INDEX idx_performance_goals_employee (employee_id),
  CONSTRAINT fk_performance_goals_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_goals_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_goals_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_performance_goals_progress CHECK (progress_percent BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- performance_reviews
-- Status moves draft -> in_progress -> submitted -> reviewed ->
-- completed. A review stays invisible to the employee while
-- draft/in_progress (the manager is still drafting it); it becomes
-- visible once submitted, and the employee can add their own comments
-- when acknowledging it.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS performance_reviews (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id             BIGINT UNSIGNED NOT NULL,
  employee_id            BIGINT UNSIGNED NOT NULL,
  reviewer_id            BIGINT UNSIGNED NULL,
  review_period_start    DATE NOT NULL,
  review_period_end      DATE NOT NULL,
  status                 ENUM('draft', 'in_progress', 'submitted', 'reviewed', 'completed') NOT NULL DEFAULT 'draft',
  overall_rating         DECIMAL(3,1) NULL,
  strengths              VARCHAR(2000) NULL,
  areas_for_improvement  VARCHAR(2000) NULL,
  manager_feedback       VARCHAR(2000) NULL,
  employee_comments      VARCHAR(2000) NULL,
  submitted_at           TIMESTAMP NULL,
  reviewed_at            TIMESTAMP NULL,
  completed_at           TIMESTAMP NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_performance_reviews_company (company_id),
  INDEX idx_performance_reviews_employee (employee_id),
  INDEX idx_performance_reviews_status (status),
  CONSTRAINT fk_performance_reviews_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_reviews_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_performance_reviews_rating CHECK (overall_rating IS NULL OR (overall_rating BETWEEN 0 AND 5))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- documents
-- Employee documents (spec Section 12). Files are stored OUTSIDE any
-- web-served directory (see backend/uploads/, never mounted via
-- express.static) and are only reachable through the authenticated
-- GET /api/documents/:id/download route, which re-checks that the
-- requester is either staff with documents:manage or the owning
-- employee before streaming bytes. `stored_filename` is a randomly
-- generated name on disk — never the original filename — so a leaked
-- disk path alone reveals nothing about document content.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id        BIGINT UNSIGNED NOT NULL,
  employee_id       BIGINT UNSIGNED NOT NULL,
  document_type     ENUM('employment_contract', 'identification', 'certificate', 'payslip', 'hr_letter', 'company_policy', 'other') NOT NULL DEFAULT 'other',
  title             VARCHAR(200) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename   VARCHAR(255) NOT NULL,
  mime_type         VARCHAR(150) NULL,
  size_bytes        BIGINT UNSIGNED NULL,
  uploaded_by       BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uq_documents_stored_filename (stored_filename),
  INDEX idx_documents_company (company_id),
  INDEX idx_documents_employee (employee_id),
  INDEX idx_documents_type (document_type),
  CONSTRAINT fk_documents_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- notifications
-- One row per (user, event). `link` is a relative frontend path the
-- client can navigate to on click (e.g. "/dashboard/my-leave").
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     VARCHAR(500) NULL,
  link        VARCHAR(255) NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_company (company_id),
  INDEX idx_notifications_unread (user_id, is_read),
  CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  author_id       BIGINT UNSIGNED NULL,
  attachment_url  VARCHAR(500) NULL,
  published_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL,
  INDEX idx_announcements_company (company_id),
  CONSTRAINT fk_announcements_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- user_permissions (direct per-user permission grants — lets a Company
-- Admin give an individual Manager an extra capability, e.g.
-- 'employees:manage', WITHOUT promoting their role. This is what makes
-- "Managers must not access company-wide administrative functions
-- unless explicitly granted permission" (spec Section 1) enforceable.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_permissions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_permission (user_id, permission_id),
  CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- audit_logs (introduced now so authMiddleware / services can log
-- from Phase 1 onward; full reporting UI comes in Phase 10)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NULL,
  user_id       BIGINT UNSIGNED NULL,
  action        VARCHAR(100) NOT NULL,
  resource      VARCHAR(100) NOT NULL,
  resource_id   BIGINT UNSIGNED NULL,
  ip_address    VARCHAR(64) NULL,
  previous_value JSON NULL,
  new_value     JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_company (company_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created (created_at),
  CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- The following tables belong to later phases (10). They are NOT
-- created by this script; they are listed here only as a reference so
-- the schema stays consistent with the full data model — Phase 10
-- (Reports + Analytics + Audit Logs) is served entirely by queries
-- over the tables already created above plus the `audit_logs` table
-- from Phase 1, so no new tables are expected there.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 1;
