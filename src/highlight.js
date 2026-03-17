export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function syntaxHighlight(code, type = 'css') {
  if (type === 'json') return highlightJSON(code)
  return highlightCSS(code)
}

function highlightCSS(css) {
  return css.split('\n').map(line => {
    const e = escapeHtml(line)
    if (/^\s*\/\//.test(line) || /^\s*\/\*/.test(line))
      return `<span class="hl-comment">${e}</span>`
    if (/^\s*@/.test(line))
      return `<span class="hl-at">${e}</span>`
    if (/^\s*\.[^\{]+\{/.test(line))
      return e.replace(/^(\s*)(\.[^\{]+)(\{)/, '$1<span class="hl-sel">$2</span>$3')
    if (/^\s*[\w-]+\s*:/.test(line))
      return e.replace(/^(\s*)([\w-]+)(\s*:\s*)(.+)$/,
        (_, indent, prop, colon, val) =>
          `${indent}<span class="hl-prop">${prop}</span>${colon}<span class="hl-val">${val}</span>`)
    return e
  }).join('\n')
}

function highlightJSON(json) {
  return escapeHtml(json)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span class="hl-prop">${match}</span>`
        return `<span class="hl-val">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`
      if (/null/.test(match)) return `<span class="hl-null">${match}</span>`
      return `<span class="hl-num">${match}</span>`
    })
}
