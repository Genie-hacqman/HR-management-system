import api from './api';

export async function listAnnouncements() {
  const { data } = await api.get('/announcements');
  return data.data.announcements;
}

export async function createAnnouncement(payload) {
  const { data } = await api.post('/announcements', payload);
  return data.data.announcement;
}

export async function updateAnnouncement(id, fields) {
  const { data } = await api.put(`/announcements/${id}`, fields);
  return data.data.announcement;
}

export async function deleteAnnouncement(id) {
  await api.delete(`/announcements/${id}`);
}
