import { useState } from 'react'
import { getDaysInMonth, getFirstDayOfMonth } from '../lib/utils'

interface Props {
  selectedDates: string[]
  onChange: (dates: string[]) => void
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function Calendar({ selectedDates, onChange }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const toDateStr = (day: number) =>
    `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  const toggleDate = (day: number) => {
    const d = toDateStr(day)
    if (selectedDates.includes(d)) {
      onChange(selectedDates.filter(x => x !== d))
    } else {
      onChange([...selectedDates, d])
    }
  }

  const isPast = (day: number) => {
    const date = new Date(year, month, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  const prevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
  }

  const monthName = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthName}</span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const past = isPast(day)
          const selected = selectedDates.includes(toDateStr(day))
          return (
            <button
              key={day}
              disabled={past}
              onClick={() => toggleDate(day)}
              className={`aspect-square rounded-full text-sm transition-colors ${
                past
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {selectedDates.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
