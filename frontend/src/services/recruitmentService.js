import axios from 'axios';
import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export async function createJobPosting(payload) {
  const { data } = await api.post('/recruitment/jobs', payload);
  return data.data.posting;
}

export async function listJobPostings(params = {}) {
  const { data } = await api.get('/recruitment/jobs', { params });
  return data.data;
}

export async function getJobPosting(id) {
  const { data } = await api.get(`/recruitment/jobs/${id}`);
  return data.data.posting;
}

export async function updateJobPosting(id, fields) {
  const { data } = await api.put(`/recruitment/jobs/${id}`, fields);
  return data.data.posting;
}

export async function publishJobPosting(id) {
  const { data } = await api.post(`/recruitment/jobs/${id}/publish`);
  return data.data.posting;
}

export async function closeJobPosting(id) {
  const { data } = await api.post(`/recruitment/jobs/${id}/close`);
  return data.data.posting;
}

export async function listApplications(params = {}) {
  const { data } = await api.get('/recruitment/applications', { params });
  return data.data;
}

export async function getApplication(id) {
  const { data } = await api.get(`/recruitment/applications/${id}`);
  return data.data.application;
}

export async function setApplicationStatus(id, status) {
  const { data } = await api.patch(`/recruitment/applications/${id}/status`, { status });
  return data.data.application;
}

export async function updateApplicationNotes(id, notes) {
  const { data } = await api.put(`/recruitment/applications/${id}/notes`, { notes });
  return data.data.application;
}

export async function scheduleInterview(applicationId, payload) {
  const { data } = await api.post(`/recruitment/applications/${applicationId}/interviews`, payload);
  return data.data.interview;
}

export async function listInterviews(applicationId) {
  const { data } = await api.get(`/recruitment/applications/${applicationId}/interviews`);
  return data.data.interviews;
}

export async function updateInterview(id, fields) {
  const { data } = await api.put(`/recruitment/interviews/${id}`, fields);
  return data.data.interview;
}

// --- Public careers page (no auth — plain axios, no token attached) --------

export async function listPublicJobs(companySlug) {
  const { data } = await axios.get(`${API_BASE_URL}/recruitment/public/${companySlug}/jobs`);
  return data.data.jobs;
}

export async function getPublicJob(companySlug, jobSlug) {
  const { data } = await axios.get(`${API_BASE_URL}/recruitment/public/${companySlug}/jobs/${jobSlug}`);
  return data.data.job;
}

export async function submitPublicApplication(companySlug, jobSlug, payload) {
  const { data } = await axios.post(`${API_BASE_URL}/recruitment/public/${companySlug}/jobs/${jobSlug}/apply`, payload);
  return data.data;
}
