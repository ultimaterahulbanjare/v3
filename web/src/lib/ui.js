export function fmt(n){ return new Intl.NumberFormat().format(n) }
export function relTime(iso){
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const m = Math.floor(diff/60000)
  if(m < 1) return "just now"
  if(m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if(h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}
