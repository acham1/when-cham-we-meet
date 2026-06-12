import { useRef, useCallback, useEffect, useState } from 'react'
import { generateTimeSlots, formatTime, formatDateShort, slotKey, useMediaQuery } from '../lib/utils'

interface Props {
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: number
  selectedSlots: Set<string>
  onChange: (slots: Set<string>) => void
}

const MIN_COL_WIDTH = 80

export default function AvailabilityGrid({
  dates,
  startHour,
  endHour,
  slotMinutes,
  selectedSlots,
  onChange,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [localSlots, setLocalSlots] = useState<Set<string>>(selectedSlots)

  const paintState = useRef<{
    active: boolean
    mode: 'select' | 'deselect'
    lastKey: string | null
  }>({ active: false, mode: 'select', lastKey: null })

  const localSlotsRef = useRef(localSlots)
  localSlotsRef.current = localSlots

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    setLocalSlots(selectedSlots)
  }, [selectedSlots])

  const timeSlots = generateTimeSlots(startHour, endHour, slotMinutes)
  const visibleDates = isMobile ? [dates[activeDayIndex]] : dates

  const gridTemplateColumns = isMobile
    ? '72px 1fr'
    : `72px repeat(${visibleDates.length}, 1fr)`

  const minWidth = isMobile ? undefined : 72 + visibleDates.length * MIN_COL_WIDTH

  const getCellKey = useCallback((x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)
    return (el as HTMLElement)?.dataset?.slot ?? null
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const key = getCellKey(e.clientX, e.clientY)
    if (!key) return
    e.preventDefault()

    const isSelected = localSlotsRef.current.has(key)
    paintState.current = { active: true, mode: isSelected ? 'deselect' : 'select', lastKey: key }

    setLocalSlots(prev => {
      const next = new Set(prev)
      if (paintState.current.mode === 'select') next.add(key)
      else next.delete(key)
      return next
    })

    navigator.vibrate?.(5)
  }, [getCellKey])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!paintState.current.active) return
    e.preventDefault()

    const key = getCellKey(e.clientX, e.clientY)
    if (!key || key === paintState.current.lastKey) return
    paintState.current.lastKey = key

    setLocalSlots(prev => {
      const next = new Set(prev)
      if (paintState.current.mode === 'select') next.add(key)
      else next.delete(key)
      return next
    })
  }, [getCellKey])

  useEffect(() => {
    const up = () => {
      if (!paintState.current.active) return
      paintState.current.active = false
      onChangeRef.current(new Set(localSlotsRef.current))
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  const selectAllDay = (date: string) => {
    const next = new Set(localSlots)
    for (const t of timeSlots) next.add(slotKey(date, t))
    setLocalSlots(next)
    onChange(next)
  }

  const clearDay = (date: string) => {
    const next = new Set(localSlots)
    for (const t of timeSlots) next.delete(slotKey(date, t))
    setLocalSlots(next)
    onChange(next)
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
            {formatDateShort(dates[activeDayIndex])}
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              {activeDayIndex + 1}/{dates.length}
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
          {/* Date header (desktop) */}
          {!isMobile && (
            <div
              className="grid border-b border-gray-200 bg-gray-50"
              style={{ gridTemplateColumns }}
            >
              <div />
              {visibleDates.map(date => (
                <div key={date} className="py-2 text-center text-xs font-semibold text-gray-700">
                  {formatDateShort(date)}
                </div>
              ))}
            </div>
          )}

          {/* Time grid */}
          <div
            className="grid bg-white"
            style={{ gridTemplateColumns }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
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
                  const selected = localSlots.has(key)
                  return (
                    <div
                      key={key}
                      data-slot={key}
                      className={`border-l ${timeIdx === 0 ? '' : 'border-t'} border-gray-100 transition-colors duration-75 ${
                        selected ? 'bg-emerald-400' : 'bg-white'
                      }`}
                      style={{
                        height: isMobile ? 44 : 32,
                        touchAction: 'none',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* All day / Clear buttons */}
          <div
            className="grid border-t border-gray-200 bg-gray-50"
            style={{ gridTemplateColumns }}
          >
            <div />
            {visibleDates.map(date => (
              <div key={date} className="flex gap-1 px-1 py-1.5">
                <button
                  onClick={() => selectAllDay(date)}
                  className="flex-1 rounded bg-gray-200/70 px-1 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-300 active:bg-gray-400"
                >
                  All day
                </button>
                <button
                  onClick={() => clearDay(date)}
                  className="flex-1 rounded bg-gray-200/70 px-1 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-300 active:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
