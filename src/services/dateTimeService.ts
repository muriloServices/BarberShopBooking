export type TimeInterval = { start: number; end: number }

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function partsAt(epoch: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(epoch)
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]))
}

function sameLocalDateTime(
  actual: Record<string, number>,
  target: { year: number; month: number; day: number; hour: number; minute: number },
) {
  return actual.year === target.year &&
    actual.month === target.month &&
    actual.day === target.day &&
    actual.hour === target.hour &&
    actual.minute === target.minute &&
    actual.second === 0
}

export function localTimeToEpoch(date: string, hour: number, timeZone: string): number | null {
  const { year, month, day } = dateParts(date)
  const target = { year, month, day, hour, minute: 0 }
  const localAsUtc = Date.UTC(year, month - 1, day, hour)
  const candidates = new Set<number>()

  for (let offset = -14; offset <= 14; offset += 1) {
    const candidate = localAsUtc + offset * 60 * 60 * 1000
    try {
      if (sameLocalDateTime(partsAt(candidate, timeZone), target)) candidates.add(candidate)
    } catch {
      return null
    }
  }

  return candidates.size === 1 ? [...candidates][0] : null
}

export function businessDayBounds(date: string, timeZone: string): TimeInterval | null {
  const { year, month, day } = dateParts(date)
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1))
  const nextKey = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDate.getUTCDate()).padStart(2, '0')}`
  const start = localTimeToEpoch(date, 0, timeZone)
  const end = localTimeToEpoch(nextKey, 0, timeZone)
  if (start === null || end === null || end <= start) return null
  return { start, end }
}

export function hourlyInterval(date: string, hour: number, timeZone: string): TimeInterval | null {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  const start = localTimeToEpoch(date, hour, timeZone)
  const nextDate = hour === 23
    ? (() => {
      const { year, month, day } = dateParts(date)
      const next = new Date(Date.UTC(year, month - 1, day + 1))
      return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
    })()
    : date
  const end = localTimeToEpoch(nextDate, (hour + 1) % 24, timeZone)
  if (start === null || end === null || end - start !== 60 * 60 * 1000) return null
  return { start, end }
}

export function parseCanonicalInstant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null
  const epoch = Date.parse(value)
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value ? epoch : null
}

export function businessDateKey(epoch: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(epoch)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}
