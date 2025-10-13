import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kris-kringle-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function requestMagicLink(email) {
  return api.post('/auth/magic-link', { email });
}

export function completeMagicLink(params) {
  return api.post('/auth/callback', params);
}

export function logout(token) {
  return api.post('/auth/logout', { token });
}

export function fetchProfile() {
  return api.get('/employee/me');
}

export function fetchRecipient() {
  return api.get('/employee/recipient');
}

export function fetchAllWishlists() {
  return api.get('/employee/wishlists');
}

export function fetchWishlist() {
  return api.get('/wishlist');
}

export function submitWishlist(items) {
  return api.post('/wishlist', { items });
}

export function confirmWishlist(token) {
  return api.post('/wishlist/confirm', { token });
}

export function fetchEmployees() {
  return api.get('/admin/employees');
}

export function uploadEmployees(formData) {
  return api.post('/admin/employees/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export function generateAssignments() {
  return api.post('/admin/assignments/generate');
}

export function notifyAssignments() {
  return api.post('/admin/assignments/notify');
}

export function fetchSettings() {
  return api.get('/admin/settings');
}

export function updateSettings(payload) {
  return api.put('/admin/settings', payload);
}

export default api;
