export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatTime(dateTimeString) {
  if (!dateTimeString) return '—';
  return new Date(dateTimeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
