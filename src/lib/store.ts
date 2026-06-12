import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore'
import { getApp, USE_FIREBASE } from './firebase'
import type { EventData, ResponseData } from './types'

let db: Firestore | null = null

function getDb(): Firestore {
  if (!db) db = getFirestore(getApp())
  return db
}

function getLocalEvents(): Record<string, EventData> {
  try {
    return JSON.parse(localStorage.getItem('w2m:events') || '{}')
  } catch {
    return {}
  }
}

function getLocalResponses(eventId: string): ResponseData[] {
  try {
    return JSON.parse(localStorage.getItem(`w2m:${eventId}:responses`) || '[]')
  } catch {
    return []
  }
}

function setLocalResponses(eventId: string, responses: ResponseData[]) {
  localStorage.setItem(`w2m:${eventId}:responses`, JSON.stringify(responses))
  window.dispatchEvent(new CustomEvent('w2m:change', { detail: eventId }))
}

export async function createEvent(event: EventData): Promise<void> {
  if (USE_FIREBASE) {
    await setDoc(doc(getDb(), 'events', event.id), event)
  } else {
    const events = getLocalEvents()
    events[event.id] = event
    localStorage.setItem('w2m:events', JSON.stringify(events))
  }
}

export async function fetchEvent(id: string): Promise<EventData | null> {
  if (USE_FIREBASE) {
    const snap = await getDoc(doc(getDb(), 'events', id))
    return snap.exists() ? (snap.data() as EventData) : null
  }
  return getLocalEvents()[id] || null
}

export async function saveResponse(
  eventId: string,
  response: { id: string; name: string; slots: string[] },
): Promise<void> {
  const data: ResponseData = { ...response, updatedAt: Date.now() }

  if (USE_FIREBASE) {
    await setDoc(doc(getDb(), 'events', eventId, 'responses', response.id), data)
  } else {
    const responses = getLocalResponses(eventId)
    const idx = responses.findIndex(r => r.id === response.id)
    if (idx >= 0) responses[idx] = data
    else responses.push(data)
    setLocalResponses(eventId, responses)
  }
}

export function subscribeToResponses(
  eventId: string,
  cb: (responses: ResponseData[]) => void,
): () => void {
  if (USE_FIREBASE) {
    return onSnapshot(collection(getDb(), 'events', eventId, 'responses'), snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResponseData)))
    })
  }

  const read = () => cb(getLocalResponses(eventId))
  read()

  const onCustom = (e: Event) => {
    if ((e as CustomEvent).detail === eventId) read()
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(`w2m:${eventId}`)) read()
  }

  window.addEventListener('w2m:change', onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('w2m:change', onCustom)
    window.removeEventListener('storage', onStorage)
  }
}
