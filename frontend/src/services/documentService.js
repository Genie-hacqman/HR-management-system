import api from './api';

export async function uploadDocument({ employeeId, documentType, title, file }) {
  const formData = new FormData();
  formData.append('employeeId', employeeId);
  formData.append('documentType', documentType);
  formData.append('title', title);
  formData.append('file', file);
  const { data } = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.document;
}

export async function listDocuments(params = {}) {
  const { data } = await api.get('/documents', { params });
  return data.data.documents;
}

export async function getMyDocuments() {
  const { data } = await api.get('/documents/me');
  return data.data.documents;
}

/**
 * Documents have no public URL — the download endpoint requires the
 * same Authorization header as every other API call, so we fetch it as
 * a blob (via the shared axios instance, which attaches the token)
 * and trigger a client-side save rather than pointing an <a href> at
 * a raw path.
 */
export async function downloadDocument(id, filename) {
  const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'document');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}
