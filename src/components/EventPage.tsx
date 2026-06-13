import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import AvailabilityGrid from './AvailabilityGrid'
import GroupView from './GroupView'
import { useAuth } from '../lib/auth'
import { fetchEvent, saveResponse, subscribeToResponses } from '../lib/store'
import { generateId } from '../lib/utils'
import type { EventData, ResponseData } from '../lib/types'

type Tab = 'yours' | 'group'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventData | null>(null)
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [name, setName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<Tab>('yours')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [copied, setCopied] = useState(false)

  const responseIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!id) return
    fetchEvent(id).then(e => {
      if (e) setEvent(e)
      else setNotFound(true)
      setLoading(false)
    })
    return subscribeToResponses(id, setResponses)
  }, [id])

  useEffect(() => {
    if (!id) return
    const savedName = localStorage.getItem(`w2m:${id}:name`)
    const savedRid = localStorage.getItem(`w2m:${id}:rid`)
    if (savedName) {
      setName(savedName)
      setNameConfirmed(true)
    } else if (user?.displayName) {
      setName(user.displayName)
    }
    if (savedRid) responseIdRef.current = savedRid
  }, [id])

  useEffect(() => {
    if (!responseIdRef.current) return
    const existing = responses.find(r => r.id === responseIdRef.current)
    if (existing) {
      setSelectedSlots(new Set(existing.slots))
    }
  }, [responses])

  const doSave = useCallback(
    async (slots: Set<string>) => {
      if (!id || !name.trim()) return
      const rid = responseIdRef.current || generateId()
      if (!responseIdRef.current) {
        responseIdRef.current = rid
        localStorage.setItem(`w2m:${id}:rid`, rid)
      }
      localStorage.setItem(`w2m:${id}:name`, name.trim())

      setSaveStatus('saving')
      await saveResponse(id, { id: rid, name: name.trim(), slots: Array.from(slots) })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    },
    [id, name],
  )

  const handleSlotsChange = useCallback(
    (slots: Set<string>) => {
      setSelectedSlots(slots)
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => doSave(slots), 600)
    },
    [doSave],
  )

  const handleConfirmName = () => {
    if (!name.trim()) return
    setNameConfirmed(true)

    if (id) {
      const matchByName = responses.find(
        r => r.name.toLowerCase() === name.trim().toLowerCase() && !responseIdRef.current,
      )
      if (matchByName) {
        responseIdRef.current = matchByName.id
        localStorage.setItem(`w2m:${id}:rid`, matchByName.id)
        setSelectedSlots(new Set(matchByName.slots))
      } else if (responseIdRef.current) {
        doSave(selectedSlots)
      }
    }
  }

  const handleCopyLink = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.name, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-gray-900">Event not found</h1>
        <p className="mt-1 text-sm text-gray-500">This event may have been deleted or the link is incorrect.</p>
        <Link
          to="/"
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create a new event
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{event.name}</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              {event.dates.length} date{event.dates.length !== 1 ? 's' : ''} &middot; {event.timezone}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300"
          >
            {copied ? 'Copied!' : 'Share link'}
          </button>
        </div>

        {/* Name input */}
        {!nameConfirmed ? (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <label htmlFor="your-name" className="block text-sm font-medium text-gray-700">
              What's your name?
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="your-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleConfirmName()}
                autoFocus
              />
              <button
                onClick={handleConfirmName}
                disabled={!name.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="font-medium">{name}</span>
            <button
              onClick={() => setNameConfirmed(false)}
              className="ml-1 text-xs text-gray-400 hover:text-gray-600"
            >
              change
            </button>
            {saveStatus === 'saving' && (
              <span className="ml-auto text-xs text-gray-400">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="ml-auto text-xs text-emerald-600">Saved</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setTab('yours')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'yours'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Your availability
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'group'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Group ({responses.length})
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {tab === 'yours' ? (
            nameConfirmed ? (
              <AvailabilityGrid
                dates={event.dates}
                startHour={event.startHour}
                endHour={event.endHour}
                slotMinutes={event.slotMinutes}
                selectedSlots={selectedSlots}
                onChange={handleSlotsChange}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm text-gray-500">Enter your name above to get started.</p>
              </div>
            )
          ) : (
            <GroupView
              dates={event.dates}
              startHour={event.startHour}
              endHour={event.endHour}
              slotMinutes={event.slotMinutes}
              responses={responses}
            />
          )}
        </div>
      </div>
    </div>
  )
}
