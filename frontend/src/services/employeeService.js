import api from './api';

export async function listEmployees(params = {}) {
  const { data } = await api.get('/employees', { params });
  return data.data; // { data: [...], pagination: {...} }
}

export async function getEmployee(id) {
  const { data } = await api.get(`/employees/${id}`);
  return data.data.employee;
}

export async function createEmployee(payload) {
  const { data } = await api.post('/employees', payload);
  return data.data.employee;
}

export async function updateEmployee(id, fields) {
  const { data } = await api.put(`/employees/${id}`, fields);
  return data.data.employee;
}

export async function setEmployeeStatus(id, status) {
  const { data } = await api.patch(`/employees/${id}/status`, { status });
  return data.data.employee;
}

export async function deactivateEmployee(id) {
  await api.delete(`/employees/${id}`);
}

export async function getEmployeeHistory(id) {
  const { data } = await api.get(`/employees/${id}/history`);
  return data.data.history;
}

export async function getMyProfile() {
  const { data } = await api.get('/employees/me');
  return data.data.employee;
}

export async function updateMyProfile(fields) {
  const { data } = await api.put('/employees/me', fields);
  return data.data.employee;
}

export async function getMyTeam() {
  const { data } = await api.get('/employees/me/team');
  return data.data;
}

export async function getDepartmentDistribution() {
  const { data } = await api.get('/employees/stats/department-distribution');
  return data.data.distribution;
}
