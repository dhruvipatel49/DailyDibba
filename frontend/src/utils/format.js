/**
 * Safely convert an order's address (JSONB object or string) into a display string.
 */
export function formatAddress(addr) {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [addr.flat, addr.street, addr.landmark, addr.city, addr.state, addr.zip, addr.country]
    .filter(Boolean);
  return parts.join(', ');
}

/**
 * Format an ISO timestamp for Indian locale display.
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

