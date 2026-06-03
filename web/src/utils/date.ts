const DB_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

export function parseTimestamp(value: string): Date {
  if (DB_DATE_TIME_RE.test(value)) {
    return new Date(value.replace(' ', 'T') + 'Z')
  }

  return new Date(value)
}

export function formatLocalDateTime(value: string): string {
  return parseTimestamp(value).toLocaleString()
}

export function formatLocalDate(value: string): string {
  return parseTimestamp(value).toLocaleDateString()
}
