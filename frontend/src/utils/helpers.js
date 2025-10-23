export function formatDate(date) {
  return new Date(date).toLocaleString();
}

export function toTitleCase(value) {
  return value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function buildEmployeePhotoUrl(filename) {
  if (!filename) {
    return '';
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3060/api';
  const origin = apiBase.replace(/\/?api\/?$/, '');
  const encoded = encodeURIComponent(filename).replace(/%2F/g, '/');
  return `${origin}/images/employees/${encoded}`;
}
