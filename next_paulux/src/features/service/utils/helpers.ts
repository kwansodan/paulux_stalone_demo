export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 1) {
    return "0 mins"
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} min${durationMinutes === 1 ? "" : "s"}`
  }

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (minutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`
  }

  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min${minutes === 1 ? "" : "s"}`
}


export function formatDurationShort(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
