/**
 * 递归收集图层，并生成缩略图 dataURL
 */
export function collectLayers(children, result, mode, sourceName = '') {
  if (!children) return
  children.forEach(layer => {
    if (layer.hidden) return
    if (layer.children) {
      if (mode !== 'top') collectLayers(layer.children, result, mode, sourceName)
      return
    }
    const top    = layer.top    || 0
    const left   = layer.left   || 0
    const bottom = layer.bottom || 0
    const right  = layer.right  || 0
    const w = right - left
    const h = bottom - top
    if (w <= 0 || h <= 0) return

    // 生成缩略图
    let thumbnail = ''
    if (layer.canvas) {
      try {
        const canvas = document.createElement('canvas')
        const maxSize = 40
        const scale = Math.min(maxSize / w, maxSize / h, 1)
        canvas.width  = Math.max(1, Math.round(w * scale))
        canvas.height = Math.max(1, Math.round(h * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height)
        thumbnail = canvas.toDataURL('image/png')
      } catch (e) { /* ignore */ }
    }

    result.push({
      name:      layer.name || 'layer',
      x: left, y: top, w, h,
      thumbnail,
      source: sourceName
    })
  })
}
