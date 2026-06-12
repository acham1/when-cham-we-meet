export interface EventData {
  id: string
  name: string
  dates: string[]
  startHour: number
  endHour: number
  slotMinutes: number
  createdAt: number
  timezone: string
  createdBy?: string
}

export interface ResponseData {
  id: string
  name: string
  slots: string[]
  updatedAt: number
}
