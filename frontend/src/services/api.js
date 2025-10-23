import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3060/api'
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

export function fetchEmployeePhotoFiles() {
  return api.get('/admin/employees/photo-files');
}

export function updateEmployeePhoto(employeeId, photoFilename) {
  return api.post(`/admin/employees/${employeeId}/photo`, { photoFilename });
}

export function uploadEmployeePhotos(formData) {
  return api.post('/admin/employees/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function mapEmployeePhotos() {
  return api.post('/admin/employees/photos/map');
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

export function fetchIncompleteWishlists() {
  return api.get('/admin/wishlists/incomplete');
}

export function sendWishlistReminders() {
  return api.post('/admin/wishlists/send-reminders');
}

export function fetchNotificationJobStatus() {
  return api.get('/admin/notifications/status');
}

export function cancelNotificationJob() {
  return api.post('/admin/notifications/cancel');
}

export default api;
