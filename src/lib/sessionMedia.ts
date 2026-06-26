const captureStore = new Map<string, string>()

const buildKey = (sessionId: string, testId: string) => `${sessionId}:${testId}`

export const setSessionCapture = (sessionId: string, testId: string, dataUrl: string) => {
  captureStore.set(buildKey(sessionId, testId), dataUrl)
}

export const getSessionCapture = (sessionId: string, testId: string) =>
  captureStore.get(buildKey(sessionId, testId)) ?? null

export const clearSessionCapture = (sessionId: string, testId: string) => {
  captureStore.delete(buildKey(sessionId, testId))
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
