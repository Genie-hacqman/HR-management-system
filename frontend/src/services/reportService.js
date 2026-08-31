import api from './api';

async function fetchJson(path, params) {
  const { data } = await api.get(path, { params });
  return data.data;
}

async function downloadCsv(path, params, filename) {
  const response = await api.get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const REPORTS = {
  employees: { path: '/reports/employees', filename: 'employee-report.csv' },
  attendance: { path: '/reports/attendance', filename: 'attendance-report.csv' },
  leave: { path: '/reports/leave', filename: 'leave-report.csv' },
  payroll: { path: '/reports/payroll', filename: 'payroll-report.csv' },
  recruitment: { path: '/reports/recruitment', filename: 'recruitment-report.csv' },
  performance: { path: '/reports/performance', filename: 'performance-report.csv' },
};

export async function getReport(key, params = {}) {
  return fetchJson(REPORTS[key].path, params);
}

export async function downloadReport(key, params = {}) {
  return downloadCsv(REPORTS[key].path, params, REPORTS[key].filename);
}
