const { pool } = require('../config/db');

async function findBySlug(slug) {
  const [rows] = await pool.query(`SELECT * FROM roles WHERE slug = :slug LIMIT 1`, { slug });
  return rows[0] || null;
}

async function assignRoleToUser({ userId, roleId, companyId }) {
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, company_id)
     VALUES (:userId, :roleId, :companyId)
     ON DUPLICATE KEY UPDATE company_id = VALUES(company_id)`,
    { userId, roleId, companyId }
  );
}

async function getRolesForUser(userId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.name, r.slug
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = :userId`,
    { userId }
  );
  return rows;
}

async function getPermissionsForUser(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT p.slug
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = :userId
     UNION
     SELECT DISTINCT p.slug
     FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     WHERE up.user_id = :userId`,
    { userId }
  );
  return rows.map((r) => r.slug);
}

/** Full catalog of assignable roles (excludes super_admin — platform-only, never assignable within a company). */
async function listAssignableRoles() {
  const [rows] = await pool.query(
    `SELECT id, name, slug, description FROM roles WHERE slug != 'super_admin' ORDER BY id`
  );
  return rows;
}

async function listAllPermissions() {
  const [rows] = await pool.query(
    `SELECT id, name, slug, module, description FROM permissions ORDER BY module, name`
  );
  return rows;
}

/**
 * Replaces a user's role set within a company (transaction-safe). Company
 * scoping is enforced by the caller passing a companyId already verified
 * against req.companyId — this function does not re-check it, so it must
 * only ever be invoked from a service that has already done so.
 */
async function replaceUserRoles(userId, companyId, roleSlugs) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM user_roles WHERE user_id = :userId AND company_id = :companyId`, {
      userId,
      companyId,
    });
    if (roleSlugs.length > 0) {
      const [roleRows] = await conn.query(
        `SELECT id, slug FROM roles WHERE slug IN (:slugs) AND slug != 'super_admin'`,
        { slugs: roleSlugs }
      );
      for (const role of roleRows) {
        await conn.query(
          `INSERT INTO user_roles (user_id, role_id, company_id) VALUES (:userId, :roleId, :companyId)`,
          { userId, roleId: role.id, companyId }
        );
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Grants a single extra permission directly to a user (e.g. a Manager gaining 'employees:manage'). */
async function grantPermissionToUser(userId, permissionSlug) {
  const [permRows] = await pool.query(`SELECT id FROM permissions WHERE slug = :slug LIMIT 1`, {
    slug: permissionSlug,
  });
  if (permRows.length === 0) {
    throw Object.assign(new Error(`Unknown permission: ${permissionSlug}`), { statusCode: 422 });
  }
  await pool.query(
    `INSERT INTO user_permissions (user_id, permission_id)
     VALUES (:userId, :permissionId)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    { userId, permissionId: permRows[0].id }
  );
}

async function revokePermissionFromUser(userId, permissionSlug) {
  await pool.query(
    `DELETE up FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     WHERE up.user_id = :userId AND p.slug = :slug`,
    { userId, slug: permissionSlug }
  );
}

async function getDirectPermissionsForUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.slug FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     WHERE up.user_id = :userId`,
    { userId }
  );
  return rows.map((r) => r.slug);
}

module.exports = {
  findBySlug,
  assignRoleToUser,
  getRolesForUser,
  getPermissionsForUser,
  listAssignableRoles,
  listAllPermissions,
  replaceUserRoles,
  grantPermissionToUser,
  revokePermissionFromUser,
  getDirectPermissionsForUser,
};
