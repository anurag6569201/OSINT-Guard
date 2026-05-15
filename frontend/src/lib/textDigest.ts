/** Plain-text helpers for progressive disclosure in the analysis UI. */

export function firstSentence(text: string, maxLen = 200): string {
  const t = text.trim()
  if (!t) return ''
  const m = t.match(/^[\s\S]{1,800}?[.!?](\s|$)/)
  let s = m ? m[0].trim() : t
  const br = s.indexOf('\n')
  if (br > 0 && br < maxLen) s = s.slice(0, br).trim()
  if (s.length > maxLen) {
    const cut = s.slice(0, maxLen)
    const sp = cut.lastIndexOf(' ')
    s = (sp > 40 ? cut.slice(0, sp) : cut).trim() + '…'
  }
  return s
}

export function truncateMiddle(text: string, maxLen: number): string {
  const t = text.trim()
  if (t.length <= maxLen) return t
  const head = Math.floor((maxLen - 1) / 2)
  const tail = maxLen - head - 1
  return `${t.slice(0, head)}…${t.slice(-tail)}`
}
