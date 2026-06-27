export const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360

export const getShortestAngleDelta = (from: number, to: number) => {
  const normalizedFrom = normalizeAngle(from)
  const normalizedTo = normalizeAngle(to)
  const delta = normalizedTo - normalizedFrom

  if (delta > 180) {
    return delta - 360
  }

  if (delta < -180) {
    return delta + 360
  }

  return delta
}

export const stepAngleTowards = (from: number, to: number, easing = 0.18, threshold = 0.35) => {
  const delta = getShortestAngleDelta(from, to)

  if (Math.abs(delta) <= threshold) {
    return normalizeAngle(to)
  }

  return normalizeAngle(from + delta * easing)
}
