import api from './api';

export async function clockIn(coords = {}) {
  const { data } = await api.post('/attendance/clock-in', coords);
  return data.data.record;
}

export async function clockOut(coords = {}) {
  const { data } = await api.post('/attendance/clock-out', coords);
  return data.data.record;
}

export async function getMyToday() {
  const { data } = await api.get('/attendance/me/today');
  return data.data.record;
}

export async function getMyHistory(params = {}) {
  const { data } = await api.get('/attendance/me/history', { params });
  return data.data; // { data, pagination }
}

export async function getMySummary(params) {
  const { data } = await api.get('/attendance/me/summary', { params });
  return data.data.summary;
}

export async function getTeamAttendance(params = {}) {
  const { data } = await api.get('/attendance/team', { params });
  return data.data.team;
}

export async function listCompanyAttendance(params = {}) {
  const { data } = await api.get('/attendance', { params });
  return data.data; // { data, pagination }
}

export async function listLate(params = {}) {
  const { data } = await api.get('/attendance/late', { params });
  return data.data.employees;
}

export async function listAbsent(params = {}) {
  const { data } = await api.get('/attendance/absent', { params });
  return data.data.employees;
}

export async function getDashboardStats(params = {}) {
  const { data } = await api.get('/attendance/stats/today', { params });
  return data.data.stats;
}
