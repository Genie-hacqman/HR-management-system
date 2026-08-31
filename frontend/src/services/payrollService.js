import api from './api';

export async function createPeriod(payload) {
  const { data } = await api.post('/payroll/periods', payload);
  return data.data.payroll;
}

export async function listPeriods(params = {}) {
  const { data } = await api.get('/payroll/periods', { params });
  return data.data; // { data, pagination }
}

export async function getPeriod(id) {
  const { data } = await api.get(`/payroll/periods/${id}`);
  return data.data; // { payroll, items }
}

export async function calculatePeriod(id) {
  const { data } = await api.post(`/payroll/periods/${id}/calculate`);
  return data.data.payroll;
}

export async function updateItem(payrollId, itemId, fields) {
  const { data } = await api.put(`/payroll/periods/${payrollId}/items/${itemId}`, fields);
  return data.data.item;
}

export async function markReviewed(id) {
  const { data } = await api.post(`/payroll/periods/${id}/review`);
  return data.data.payroll;
}

export async function approvePeriod(id) {
  const { data } = await api.post(`/payroll/periods/${id}/approve`);
  return data.data.payroll;
}

export async function processPeriod(id) {
  const { data } = await api.post(`/payroll/periods/${id}/process`);
  return data.data.payroll;
}

export async function getMyPayslips(params = {}) {
  const { data } = await api.get('/payroll/payslips/me', { params });
  return data.data; // { data, pagination }
}

export async function getMyPayslip(id) {
  const { data } = await api.get(`/payroll/payslips/me/${id}`);
  return data.data.payslip;
}

export async function getMySalaryHistory(params = {}) {
  const { data } = await api.get('/payroll/salary-history/me', { params });
  return data.data; // { data, pagination }
}
