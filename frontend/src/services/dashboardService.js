import api from './api';

export async function getAdminDashboard() {
  const { data } = await api.get('/dashboard/admin');
  return data.data.dashboard;
}

export async function getManagerDashboard() {
  const { data } = await api.get('/dashboard/manager');
  return data.data.dashboard;
}

export async function getEmployeeDashboard() {
  const { data } = await api.get('/dashboard/employee');
  return data.data.dashboard;
}
