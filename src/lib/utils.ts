import { useState, useEffect } from 'react'

export function generateTimeSlots(startHour: number, endHour: number, slotMinutes: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += slotMinutes) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }
  return slots
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatTimeRange(time: string, slotMinutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMin = h * 60 + m + slotMinutes
  const endH = Math.floor(totalMin / 60) % 24
  const endM = totalMin % 60

  const startPeriod = h >= 12 ? 'PM' : 'AM'
  const endPeriod = endH >= 12 ? 'PM' : 'AM'
  const startHour = h % 12 || 12
  const endHour = endH % 12 || 12

  const startStr = m === 0 ? `${startHour}` : `${startHour}:${m.toString().padStart(2, '0')}`
  const endStr = endM === 0 ? `${endHour}` : `${endHour}:${endM.toString().padStart(2, '0')}`

  if (startPeriod === endPeriod) {
    return `${startStr}–${endStr} ${endPeriod}`
  }
  return `${startStr} ${startPeriod}–${endStr} ${endPeriod}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, b => chars[b % chars.length]).join('')
}

export function slotKey(date: string, time: string): string {
  return `${date}T${time}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}
