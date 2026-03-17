import { sanitizeClassName } from './main.js'

function toUnit(px, divisor, unit) {
  if (unit === 'px') return Math.round(px * 100) / 100 + 'px'
  return (px / divisor).toFixed(2) + unit
}

function bpVal(raw, divisor, unit) {
  return raw === 0 ? '0' : `-${toUnit(raw, divisor, unit)}`
}

function getClassName(layer, prefix) {
  // customName 为空时用 prefix + 原始名
  const raw = layer.customName && layer.customName.trim()
    ? layer.customName.trim()
    : prefix + layer.name
  return sanitizeClassName(raw)
}

function header(format, meta) {
  const now = new Date().toLocaleString('zh-CN')
  if (format === 'scss') {
    return `// 由 PSD 图层坐标导出工具生成\n// 图层数: ${meta.count}  基数: ÷${meta.divisor}  单位: ${meta.unit}  生成: ${now}\n\n`
  }
  if (format === 'wxss') {
    return `/* 由 PSD 图层坐标导出工具生成 */\n/* 图层数: ${meta.count}  基数: ÷${meta.divisor}  单位: ${meta.unit}  生成: ${now} */\n\n`
  }
  return `/* 由 PSD 图层坐标导出工具生成 */\n/* 图层数: ${meta.count}  基数: ÷${meta.divisor}  单位: ${meta.unit}  生成: ${now} */\n\n`
}

// ── CSS ──
export function generateCSS(layers, { divisor, prefix, unit }) {
  let out = header('css', { count: layers.length, divisor, unit })
  layers.forEach(l => {
    const cls = getClassName(l, prefix)
    const w   = toUnit(l.w, divisor, unit)
    const h   = toUnit(l.h, divisor, unit)
    const bpx = bpVal(l.x, divisor, unit)
    const bpy = bpVal(l.y, divisor, unit)
    out += `.${cls} {\n  width: ${w};\n  height: ${h};\n  background-position: ${bpx} ${bpy};\n}\n\n`
  })
  return out.trimEnd()
}

// ── SCSS ──
export function generateSCSS(layers, { divisor, prefix, unit }) {
  let out = header('scss', { count: layers.length, divisor, unit })
  // mixin
  out += `@mixin sprite($w, $h, $x, $y) {\n  width: $w;\n  height: $h;\n  background-position: $x $y;\n}\n\n`
  layers.forEach(l => {
    const cls = getClassName(l, prefix)
    const w   = toUnit(l.w, divisor, unit)
    const h   = toUnit(l.h, divisor, unit)
    const bpx = bpVal(l.x, divisor, unit)
    const bpy = bpVal(l.y, divisor, unit)
    out += `.${cls} {\n  @include sprite(${w}, ${h}, ${bpx}, ${bpy});\n}\n\n`
  })
  return out.trimEnd()
}

// ── WXSS（微信小程序）──
export function generateWXSS(layers, { divisor, prefix, unit }) {
  // 小程序常用 rpx，直接原始值输出 rpx（unit 强制 rpx 显示）
  let out = header('wxss', { count: layers.length, divisor, unit: 'rpx' })
  layers.forEach(l => {
    const cls = getClassName(l, prefix)
    // 小程序 rpx 不除，直接原始像素值加 rpx
    const w   = l.w + 'rpx'
    const h   = l.h + 'rpx'
    const bpx = l.x === 0 ? '0' : `-${l.x}rpx`
    const bpy = l.y === 0 ? '0' : `-${l.y}rpx`
    out += `.${cls} {\n  width: ${w};\n  height: ${h};\n  background-position: ${bpx} ${bpy};\n}\n\n`
  })
  return out.trimEnd()
}

// ── JSON ──
export function generateJSON(layers, { divisor, prefix, unit }) {
  const obj = {}
  layers.forEach(l => {
    const cls = getClassName(l, prefix)
    obj[cls] = {
      width:               toUnit(l.w, divisor, unit),
      height:              toUnit(l.h, divisor, unit),
      'background-position': `${bpVal(l.x, divisor, unit)} ${bpVal(l.y, divisor, unit)}`,
      _raw: { x: l.x, y: l.y, w: l.w, h: l.h }
    }
  })
  return JSON.stringify(obj, null, 2)
}
