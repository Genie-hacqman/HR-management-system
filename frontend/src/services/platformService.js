import api from './api';

export async function listCompanies(params = {}) {
  const { data } = await api.get('/companies', { params });
  return data.data.companies;
}

export async function setCompanyStatus(companyId, status) {
  const { data } = await api.patch(`/companies/${companyId}/status`, { status });
  return data.data.company;
}

export async function getPlatformStats() {
  const { data } = await api.get('/platform/stats');
  return data.data;
}
