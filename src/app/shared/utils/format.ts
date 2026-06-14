/** Formatea un valor numérico como pesos colombianos: 25000 → "$25.000". */
export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

/** Formatea una fecha ISO (YYYY-MM-DD) a dd/mm/aaaa. */
export function formatDateCo(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  // Soporta tanto "YYYY-MM-DD" como ISO completo "YYYY-MM-DDTHH:mm:ss".
  const datePart = value.split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) {
    return value;
  }
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

/** Formatea una hora 24h (HH:mm) a hh:mm am/pm. */
export function formatTimeCo(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const [hStr, mStr] = value.split(':');
  const hours = Number(hStr);
  if (Number.isNaN(hours)) {
    return value;
  }
  const minutes = (mStr ?? '00').padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${minutes} ${period}`;
}

/** Formatea un timestamp ISO a "dd/mm/aaaa hh:mm am/pm". */
export function formatDateTimeCo(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const time = formatTimeCo(
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  );
  return `${d}/${m}/${y} ${time}`;
}
