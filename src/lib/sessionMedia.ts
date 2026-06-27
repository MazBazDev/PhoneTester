const captureStore = new Map<string, string>()

const buildKey = (sessionId: string, testId: string, slot?: string) =>
  slot ? `${sessionId}:${testId}:${slot}` : `${sessionId}:${testId}`

export const setSessionCapture = (sessionId: string, testId: string, dataUrl: string, slot?: string) => {
  captureStore.set(buildKey(sessionId, testId, slot), dataUrl)
}

export const getSessionCapture = (sessionId: string, testId: string, slot?: string) =>
  captureStore.get(buildKey(sessionId, testId, slot)) ?? null

export const clearSessionCapture = (sessionId: string, testId: string, slot?: string) => {
  if (slot) {
    captureStore.delete(buildKey(sessionId, testId, slot))
    return
  }

  for (const key of captureStore.keys()) {
    if (key === buildKey(sessionId, testId) || key.startsWith(`${sessionId}:${testId}:`)) {
      captureStore.delete(key)
    }
  }
}

export const clearSessionMedia = (sessionId: string) => {
  for (const key of captureStore.keys()) {
    if (key.startsWith(`${sessionId}:`)) {
      captureStore.delete(key)
    }
  }
}

export const clearAllSessionMedia = () => {
  captureStore.clear()
}
