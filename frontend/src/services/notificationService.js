import api from './api';

export async function listNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params });
  return data.data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.count;
}

export async function markAsRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead() {
  await api.patch('/notifications/read-all');
}
