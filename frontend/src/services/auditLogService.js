import api from './api';

export async function listAuditLogs(params = {}) {
  const { data } = await api.get('/audit-logs', { params });
  return data.data.logs;
}
