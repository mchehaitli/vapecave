// Store is in Frisco TX — all delivery slot comparisons use Central Time.
// These helpers extract CT date/time parts via Intl and construct Date objects
// with those parts. The resulting Dates are only compared against each other
// (never as absolute UTC instants), so the server's own timezone does not matter.
export const STORE_TIMEZONE = 'America/Chicago';

const ctFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function parseCTParts(date: Date = new Date()) {
  const parts = ctFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find(p => p.type === type)!.value, 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function getNowCT(): Date {
  const p = parseCTParts();
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export function getTodayCT(): Date {
  const p = parseCTParts();
  return new Date(p.year, p.month - 1, p.day, 0, 0, 0, 0);
}

export function formatDateStrCT(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
