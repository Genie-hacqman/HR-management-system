import api from './api';

export async function listUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return data.data.users;
}

export async function inviteUser(payload) {
  const { data } = await api.post('/users/invite', payload);
  return data.data.user;
}

export async function setUserRoles(userId, roles) {
  const { data } = await api.put(`/users/${userId}/roles`, { roles });
  return data.data.user;
}

export async function setUserStatus(userId, status) {
  const { data } = await api.patch(`/users/${userId}/status`, { status });
  return data.data.user;
}

export async function listRoles() {
  const { data } = await api.get('/roles');
  return data.data.roles;
}
