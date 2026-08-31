-- =====================================================================
-- Seed data: system roles, base permissions, and a bootstrap Super Admin
-- Run AFTER schema.sql
-- =====================================================================
USE hr_saas;

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
INSERT INTO roles (name, slug, description, is_system) VALUES
  ('Super Admin',   'super_admin',   'Platform-wide administrator', TRUE),
  ('Company Admin', 'company_admin', 'Manages a single company (HR)', TRUE),
  ('Manager',       'manager',       'Manages a team within a company', TRUE),
  ('Employee',      'employee',      'Standard company employee', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- Permissions (Phase 1 set — company & user administration).
-- Additional modules (attendance:*, leave:*, payroll:*, ...) are added
-- in their respective phases without altering this table's structure.
-- ---------------------------------------------------------------------
INSERT INTO permissions (name, slug, module, description) VALUES
  ('Manage platform companies', 'platform:companies:manage', 'platform', 'Create/suspend/manage any company'),
  ('View platform statistics',  'platform:stats:view',       'platform', 'View system-wide statistics'),
  ('View audit logs',           'platform:audit:view',       'platform', 'View platform audit logs'),
  ('Manage company settings',   'company:settings:manage',   'company',  'Update company profile & settings'),
  ('Manage employees',          'employees:manage',          'employees','Create/edit/deactivate employees'),
  ('View team',                 'team:view',                 'team',     'View direct-report team members'),
  ('Manage departments',        'departments:manage',        'departments', 'Create/edit/archive departments'),
  ('Manage positions',          'positions:manage',          'positions','Create/edit/archive positions'),
  ('Manage attendance',         'attendance:manage',         'attendance','View and manage company-wide attendance'),
  ('Manage leave',               'leave:manage',              'leave',    'Approve/reject leave requests and manage leave types'),
  ('Manage payroll',             'payroll:manage',            'payroll',  'Create, calculate, review, approve, and process payroll'),
  ('Manage recruitment',         'recruitment:manage',        'recruitment','Manage job postings, applications, and interviews'),
  ('Manage performance',         'performance:manage',        'performance','Manage goals and reviews for any employee company-wide'),
  ('Manage documents',           'documents:manage',          'documents','Upload and manage employee documents'),
  ('Manage announcements',       'announcements:manage',      'announcements','Create and manage company announcements'),
  ('View reports',                'reports:view',              'reports',  'Generate and export company reports')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- Role -> Permission defaults
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'super_admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'company_admin'
  AND p.slug IN ('company:settings:manage', 'employees:manage', 'departments:manage', 'positions:manage', 'attendance:manage', 'leave:manage', 'payroll:manage', 'recruitment:manage', 'performance:manage', 'documents:manage', 'announcements:manage', 'reports:view')
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'manager'
  AND p.slug IN ('team:view')
ON DUPLICATE KEY UPDATE role_id = role_id;

-- ---------------------------------------------------------------------
-- Bootstrap Super Admin
-- Do NOT hardcode a password hash in version control. Instead, run:
--   npm run seed:admin
-- (see scripts/seedSuperAdmin.js) after `npm install`, which prompts
-- for/uses env vars SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, hashes the
-- password with bcrypt at run time, and inserts the row + super_admin
-- role assignment safely.
-- ---------------------------------------------------------------------
