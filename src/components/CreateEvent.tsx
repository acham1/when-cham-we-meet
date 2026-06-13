import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from './Calendar'
import { useAuth } from '../lib/auth'
import { USE_FIREBASE } from '../lib/firebase'
import { generateId } from '../lib/utils'
import { createEvent } from '../lib/store'

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6)

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user, signIn } = useAuth()
  const [name, setName] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(17)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = name.trim().length > 0 && dates.length > 0 && startHour < endHour

  const handleCreate = async () => {
    if (!canCreate || creating) return
    setError(null)

    let currentUser = user
    if (USE_FIREBASE && !currentUser) {
      currentUser = await signIn()
      if (!currentUser) return
    }

    setCreating(true)
    try {
      const id = generateId()
      await createEvent({
        id,
        name: name.trim(),
        dates: [...dates].sort(),
        startHour,
        endHour,
        slotMinutes: 30,
        createdAt: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdBy: currentUser?.uid,
      })
      navigate(`/event/${id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('permission')) {
        setError('Your account is not authorized to create events. Contact the site owner to become an admin.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">New event</h2>
        <p className="mt-1 text-sm text-gray-500">Find a time that works for everyone.</p>

        {!USE_FIREBASE && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Running in local mode (no Firebase configured). Data is stored in this browser only.
          </div>
        )}

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
              Event name
            </label>
            <input
              id="event-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Team lunch, Study group"
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              What dates might work?
            </label>
            <Calendar selectedDates={dates} onChange={setDates} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-hour" className="block text-sm font-medium text-gray-700">
                No earlier than
              </label>
              <select
                id="start-hour"
                value={startHour}
                onChange={e => {
                  const v = Number(e.target.value)
                  setStartHour(v)
                  if (v >= endHour) setEndHour(v + 1)
                }}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {HOURS.slice(0, -1).map(h => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="end-hour" className="block text-sm font-medium text-gray-700">
                No later than
              </label>
              <select
                id="end-hour"
                value={endHour}
                onChange={e => setEndHour(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {HOURS.filter(h => h > startHour).map(h => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {creating
              ? 'Creating...'
              : USE_FIREBASE && !user
                ? 'Admin login & create'
                : 'Create event'}
          </button>
        </div>
      </div>
    </div>
  )
}
