import api from './api';

export async function listDepartments(params = {}) {
  const { data } = await api.get('/departments', { params });
  return data.data.departments;
}

export async function createDepartment(payload) {
  const { data } = await api.post('/departments', payload);
  return data.data.department;
}

export async function updateDepartment(id, fields) {
  const { data } = await api.put(`/departments/${id}`, fields);
  return data.data.department;
}

export async function deleteDepartment(id) {
  await api.delete(`/departments/${id}`);
}

export async function listPositions(params = {}) {
  const { data } = await api.get('/positions', { params });
  return data.data.positions;
}

export async function createPosition(payload) {
  const { data } = await api.post('/positions', payload);
  return data.data.position;
}

export async function updatePosition(id, fields) {
  const { data } = await api.put(`/positions/${id}`, fields);
  return data.data.position;
}

export async function deletePosition(id) {
  await api.delete(`/positions/${id}`);
}
