const { pool } = require('../config/db');

const SORTABLE_COLUMNS = {
  name: 'e.first_name',
  employee_code: 'e.employee_code',
  department: 'd.name',
  position: 'p.title',
  employment_date: 'e.employment_date',
  status: 'e.employment_status',
  created_at: 'e.created_at',
};

const BASE_SELECT = `
  SELECT
    e.*,
    d.name AS department_name,
    p.title AS position_title,
    m.first_name AS manager_first_name,
    m.last_name AS manager_last_name
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id
  LEFT JOIN positions p ON p.id = e.position_id
  LEFT JOIN employees m ON m.id = e.manager_id
`;

/** Generates the next sequential employee code for a company, e.g. EMP-0001. */
async function nextEmployeeCode(companyId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM employees WHERE company_id = :companyId`,
    { companyId }
  );
  const next = (rows[0].total || 0) + 1;
  return `EMP-${String(next).padStart(4, '0')}`;
}

async function create(companyId, data) {
  const employeeCode = data.employeeCode || (await nextEmployeeCode(companyId));
  const [result] = await pool.query(
    `INSERT INTO employees (
      company_id, user_id, employee_code, first_name, last_name, profile_photo_url,
      email, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone,
      department_id, position_id, manager_id, employment_type, employment_date, salary,
      employment_status, bank_name, bank_account_name, bank_account_number
    ) VALUES (
      :companyId, :userId, :employeeCode, :firstName, :lastName, :profilePhotoUrl,
      :email, :phone, :dateOfBirth, :gender, :address, :emergencyContactName, :emergencyContactPhone,
      :departmentId, :positionId, :managerId, :employmentType, :employmentDate, :salary,
      :employmentStatus, :bankName, :bankAccountName, :bankAccountNumber
    )`,
    {
      companyId,
      userId: data.userId ?? null,
      employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePhotoUrl: data.profilePhotoUrl ?? null,
      email: data.email,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      departmentId: data.departmentId ?? null,
      positionId: data.positionId ?? null,
      managerId: data.managerId ?? null,
      employmentType: data.employmentType ?? 'full_time',
      employmentDate: data.employmentDate ?? null,
      salary: data.salary ?? null,
      employmentStatus: data.employmentStatus ?? 'active',
      bankName: data.bankName ?? null,
      bankAccountName: data.bankAccountName ?? null,
      bankAccountNumber: data.bankAccountNumber ?? null,
    }
  );
  return findByIdAndCompany(result.insertId, companyId);
}

async function findByIdAndCompany(id, companyId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE e.id = :id AND e.company_id = :companyId AND e.deleted_at IS NULL LIMIT 1`,
    { id, companyId }
  );
  return rows[0] || null;
}

async function findByEmailAndCompany(email, companyId) {
  const [rows] = await pool.query(
    `SELECT * FROM employees WHERE email = :email AND company_id = :companyId AND deleted_at IS NULL LIMIT 1`,
    { email, companyId }
  );
  return rows[0] || null;
}

/** Finds the employee record linked to a given login user (used for "my profile" / manager team lookups). */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE e.user_id = :userId AND e.deleted_at IS NULL LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

/**
 * Lists employees within a single company, with search/filter/sort/pagination.
 * companyId MUST come from req.companyId — never client input.
 */
async function listByCompany(companyId, {
  search = null,
  departmentId = null,
  positionId = null,
  managerId = null,
  status = null,
  sortBy = 'created_at',
  sortDir = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const params = { companyId };
  let where = `WHERE e.company_id = :companyId AND e.deleted_at IS NULL`;

  if (search) {
    where += ` AND (e.first_name LIKE :search OR e.last_name LIKE :search OR e.email LIKE :search OR e.employee_code LIKE :search)`;
    params.search = `%${search}%`;
  }
  if (departmentId) {
    where += ` AND e.department_id = :departmentId`;
    params.departmentId = departmentId;
  }
  if (positionId) {
    where += ` AND e.position_id = :positionId`;
    params.positionId = positionId;
  }
  if (managerId) {
    where += ` AND e.manager_id = :managerId`;
    params.managerId = managerId;
  }
  if (status) {
    where += ` AND e.employment_status = :status`;
    params.status = status;
  }

  const sortColumn = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.created_at;
  const direction = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM employees e ${where}`,
    params
  );

  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY ${sortColumn} ${direction} LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );

  return { data: rows, pagination: { total, page: Math.max(parseInt(page, 10) || 1, 1), pageSize: limit } };
}

/** Direct reports for a Manager's team view (Section 7/9 of spec). */
async function listDirectReports(companyId, managerId) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE e.company_id = :companyId AND e.manager_id = :managerId AND e.deleted_at IS NULL ORDER BY e.first_name`,
    { companyId, managerId }
  );
  return rows;
}

async function update(id, companyId, fields) {
  const allowed = [
    'first_name', 'last_name', 'profile_photo_url', 'email', 'phone', 'date_of_birth', 'gender',
    'address', 'emergency_contact_name', 'emergency_contact_phone', 'department_id', 'position_id',
    'manager_id', 'employment_type', 'employment_date', 'salary', 'employment_status',
    'bank_name', 'bank_account_name', 'bank_account_number',
  ];
  const setClauses = [];
  const params = { id, companyId };
  for (const key of Object.keys(fields)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return findByIdAndCompany(id, companyId);
  await pool.query(
    `UPDATE employees SET ${setClauses.join(', ')} WHERE id = :id AND company_id = :companyId`,
    params
  );
  return findByIdAndCompany(id, companyId);
}

async function setStatus(id, companyId, status) {
  await pool.query(
    `UPDATE employees SET employment_status = :status WHERE id = :id AND company_id = :companyId`,
    { id, companyId, status }
  );
  return findByIdAndCompany(id, companyId);
}

async function softDelete(id, companyId) {
  await pool.query(
    `UPDATE employees SET deleted_at = NOW(), employment_status = 'terminated'
     WHERE id = :id AND company_id = :companyId`,
    { id, companyId }
  );
}

async function countByDepartment(companyId) {
  const [rows] = await pool.query(
    `SELECT d.id AS department_id, d.name, COUNT(e.id) AS employee_count
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
     WHERE d.company_id = :companyId AND d.deleted_at IS NULL
     GROUP BY d.id, d.name
     ORDER BY d.name`,
    { companyId }
  );
  return rows;
}

module.exports = {
  nextEmployeeCode,
  create,
  findByIdAndCompany,
  findByEmailAndCompany,
  findByUserId,
  listByCompany,
  listDirectReports,
  update,
  setStatus,
  softDelete,
  countByDepartment,
};
