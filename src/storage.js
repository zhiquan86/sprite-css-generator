const KEY = 'sprite_css_gen_config'

export function saveConfig(cfg) {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)) } catch (e) {}
}

export function loadConfig() {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : null
  } catch (e) { return null }
}
