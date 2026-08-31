import api from './api';

export async function listLeaveTypes() {
  const { data } = await api.get('/leave/types');
  return data.data.leaveTypes;
}

export async function createLeaveType(payload) {
  const { data } = await api.post('/leave/types', payload);
  return data.data.leaveType;
}

export async function updateLeaveType(id, fields) {
  const { data } = await api.put(`/leave/types/${id}`, fields);
  return data.data.leaveType;
}

export async function archiveLeaveType(id) {
  await api.delete(`/leave/types/${id}`);
}

export async function getMyBalances(year) {
  const { data } = await api.get('/leave/balances/me', { params: { year } });
  return data.data.balances;
}

export async function submitRequest(payload) {
  const { data } = await api.post('/leave/requests', payload);
  return data.data.request;
}

export async function getMyRequests(params = {}) {
  const { data } = await api.get('/leave/requests/me', { params });
  return data.data; // { data, pagination }
}

export async function cancelMyRequest(id) {
  const { data } = await api.patch(`/leave/requests/${id}/cancel`);
  return data.data.request;
}

export async function listTeamRequests(params = {}) {
  const { data } = await api.get('/leave/requests/team', { params });
  return data.data.requests;
}

export async function listCompanyRequests(params = {}) {
  const { data } = await api.get('/leave/requests', { params });
  return data.data; // { data, pagination }
}

export async function getCalendar(params) {
  const { data } = await api.get('/leave/calendar', { params });
  return data.data.requests;
}

export async function approveRequest(id) {
  const { data } = await api.patch(`/leave/requests/${id}/approve`);
  return data.data.request;
}

export async function rejectRequest(id, reason) {
  const { data } = await api.patch(`/leave/requests/${id}/reject`, { reason });
  return data.data.request;
}
