import { useMemo, useState } from 'react'
import { generateTimeSlots, formatTime, formatDateLong, slotKey, useMediaQuery } from '../lib/utils'
import type { ResponseData } from '../lib/types'

interface Props {
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: number
  responses: ResponseData[]
}

const HEAT_COLORS = [
  'bg-gray-50',
  'bg-emerald-100',
  'bg-emerald-200',
  'bg-emerald-300',
  'bg-emerald-400',
  'bg-emerald-500',
  'bg-emerald-600',
]

const MIN_COL_WIDTH = 80

function heatColor(count: number, total: number): string {
  if (total === 0 || count === 0) return HEAT_COLORS[0]
  const ratio = count / total
  const idx = Math.min(Math.ceil(ratio * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1)
  return HEAT_COLORS[idx]
}

export default function GroupView({ dates, startHour, endHour, slotMinutes, responses }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const timeSlots = generateTimeSlots(startHour, endHour, slotMinutes)
  const visibleDates = isMobile ? [dates[activeDayIndex]] : dates
  const total = responses.length

  const gridTemplateColumns = isMobile
    ? '72px 1fr'
    : `72px repeat(${visibleDates.length}, 1fr)`

  const minWidth = isMobile ? undefined : 72 + visibleDates.length * MIN_COL_WIDTH

  const availability = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const r of responses) {
      for (const s of r.slots) {
        if (!map[s]) map[s] = []
        map[s].push(r.name)
      }
    }
    return map
  }, [responses])

  const selectedNames = selectedSlot ? availability[selectedSlot] || [] : []

  if (responses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No responses yet.</p>
        <p className="mt-1 text-xs text-gray-400">Share the link to get started!</p>
      </div>
    )
  }

  return (
    <div className="select-none">
      {isMobile && (
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setActiveDayIndex(i => Math.max(0, i - 1))}
            disabled={activeDayIndex === 0}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">
            {formatDateLong(dates[activeDayIndex])}
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              {activeDayIndex + 1} of {dates.length}
            </span>
          </span>
          <button
            onClick={() => setActiveDayIndex(i => Math.min(dates.length - 1, i + 1))}
            disabled={activeDayIndex === dates.length - 1}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div style={{ minWidth }}>
          {!isMobile && (
            <div
              className="grid border-b border-gray-200 bg-gray-50"
              style={{ gridTemplateColumns }}
            >
              <div />
              {visibleDates.map(date => (
                <div key={date} className="py-2 text-center text-xs font-semibold text-gray-700">
                  {formatDateLong(date)}
                </div>
              ))}
            </div>
          )}

          <div
            className="grid bg-white"
            style={{ gridTemplateColumns }}
          >
            {timeSlots.map((time, timeIdx) => (
              <div key={time} className="contents">
                <div
                  className={`flex items-center justify-end pr-3 text-xs text-gray-400 ${
                    timeIdx === 0 ? '' : 'border-t border-gray-100'
                  }`}
                  style={{ height: isMobile ? 44 : 32 }}
                >
                  {time.endsWith(':00') ? formatTime(time) : ''}
                </div>
                {visibleDates.map(date => {
                  const key = slotKey(date, time)
                  const names = availability[key] || []
                  const count = names.length
                  const isSelected = key === selectedSlot
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedSlot(isSelected ? null : key)}
                      className={`border-l ${timeIdx === 0 ? '' : 'border-t'} border-gray-100 cursor-pointer transition-colors duration-75 ${heatColor(count, total)} ${
                        isSelected ? 'ring-2 ring-inset ring-emerald-700' : ''
                      }`}
                      style={{ height: isMobile ? 44 : 32 }}
                    >
                      {count > 0 && !isMobile && (
                        <span className="flex h-full items-center justify-center text-[10px] font-medium text-emerald-900/60">
                          {count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>0/{total}</span>
        <div className="flex gap-0.5">
          {HEAT_COLORS.map((c, i) => (
            <div key={i} className={`h-3 w-5 rounded-sm ${c} border border-gray-200`} />
          ))}
        </div>
        <span>
          {total}/{total}
        </span>
      </div>

      {/* Slot detail */}
      {selectedSlot && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="text-xs font-medium text-gray-700">
            {formatDateLong(selectedSlot.split('T')[0])} at{' '}
            {formatTime(selectedSlot.split('T')[1])}
          </div>
          <div className="mt-1.5 text-xs text-gray-500">
            {selectedNames.length === 0 ? (
              'No one available'
            ) : (
              <>
                <span className="font-medium text-emerald-700">
                  {selectedNames.length}/{total} available
                </span>
                <span className="ml-1.5">{selectedNames.join(', ')}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Participants list */}
      <div className="mt-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Responses ({responses.length})
        </h4>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {responses.map(r => (
            <span
              key={r.id}
              className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
            >
              {r.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
