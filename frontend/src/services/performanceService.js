import api from './api';

export async function createGoal(payload) {
  const { data } = await api.post('/performance/goals', payload);
  return data.data.goal;
}

export async function listGoals(params = {}) {
  const { data } = await api.get('/performance/goals', { params });
  return data.data.goals;
}

export async function updateGoalProgress(id, payload) {
  const { data } = await api.patch(`/performance/goals/${id}/progress`, payload);
  return data.data.goal;
}

export async function deleteGoal(id) {
  await api.delete(`/performance/goals/${id}`);
}

export async function getMyGoals() {
  const { data } = await api.get('/performance/goals/me');
  return data.data.goals;
}

export async function createReview(payload) {
  const { data } = await api.post('/performance/reviews', payload);
  return data.data.review;
}

export async function listReviews(params = {}) {
  const { data } = await api.get('/performance/reviews', { params });
  return data.data.reviews;
}

export async function getReview(id) {
  const { data } = await api.get(`/performance/reviews/${id}`);
  return data.data.review;
}

export async function updateReview(id, fields) {
  const { data } = await api.put(`/performance/reviews/${id}`, fields);
  return data.data.review;
}

export async function startReview(id) {
  const { data } = await api.post(`/performance/reviews/${id}/start`);
  return data.data.review;
}

export async function submitReview(id) {
  const { data } = await api.post(`/performance/reviews/${id}/submit`);
  return data.data.review;
}

export async function completeReview(id) {
  const { data } = await api.post(`/performance/reviews/${id}/complete`);
  return data.data.review;
}

export async function getMyReviews() {
  const { data } = await api.get('/performance/reviews/me');
  return data.data.reviews;
}

export async function acknowledgeReview(id, comments) {
  const { data } = await api.post(`/performance/reviews/${id}/acknowledge`, { comments });
  return data.data.review;
}
