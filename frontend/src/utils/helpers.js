export function formatDate(date) {
  return new Date(date).toLocaleString();
}

export function toTitleCase(value) {
  return value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}
