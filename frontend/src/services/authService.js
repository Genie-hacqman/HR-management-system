import api, { setTokens, clearTokens } from './api';

export async function registerCompany(payload) {
  const { data } = await api.post('/auth/register-company', payload);
  return data.data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  setTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
  return data.data;
}

export async function logout() {
  const refreshToken = localStorage.getItem('hr_saas_refresh_token');
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}

export async function verifyEmail(token) {
  const { data } = await api.get('/auth/verify-email', { params: { token } });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword({ token, newPassword }) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data;
}
