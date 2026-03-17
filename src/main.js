import { readPsd } from 'ag-psd'
import { collectLayers } from './layers.js'
import { generateCSS, generateJSON, generateSCSS, generateWXSS } from './generator.js'
import { syntaxHighlight, escapeHtml } from './highlight.js'
import { loadConfig, saveConfig } from './storage.js'

// ── State ──
let parsedLayers = []   // 解析后的原始图层
let editableLayers = [] // 用户可编辑的图层列表（含勾选、重命名）
let currentFiles = []   // 上传的文件列表
let generatedOutput = { css: '', json: '', scss: '', wxss: '' }
let currentFormat = 'css'
let previewTimer = null

// ── DOM ──
const dropZone     = document.getElementById('dropZone')
const fileInput    = document.getElementById('fileInput')
const dropDefault  = document.getElementById('dropDefault')
const fileInfoEl   = document.getElementById('fileInfo')
const fileListEl   = document.getElementById('fileList')
const reselectEl   = document.getElementById('reselect')
const configPanel  = document.getElementById('configPanel')
const btnGenerate  = document.getElementById('btnGenerate')
const progressArea = document.getElementById('progressArea')
const progressBar  = document.getElementById('progressBar')
const progressText = document.getElementById('progressText')
const resultArea   = document.getElementById('resultArea')
const codePreview  = document.getElementById('codePreview')
const layerTable   = document.getElementById('layerTable')
const resultMeta   = document.getElementById('resultMeta')
const btnDownload  = document.getElementById('btnDownload')
const btnReset     = document.getElementById('btnReset')
const errorMsg     = document.getElementById('errorMsg')

// ── 初始化：恢复历史配置 ──
const savedConfig = loadConfig()
if (savedConfig) {
  document.getElementById('layerMode').value = savedConfig.layerMode || 'all'
  document.getElementById('prefix').value    = savedConfig.prefix    || 'sprite-'
  document.getElementById('divisor').value   = savedConfig.divisor   || 100
  setActiveUnit(savedConfig.unit || 'rem')
  setActiveFormat(savedConfig.format || 'css')
}

// ── 步骤管理 ──
function setStep(n) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('step' + i)
    el.classList.remove('active', 'done')
    if (i < n) el.classList.add('done')
    else if (i === n) el.classList.add('active')
  }
}

// ── 单位选择 ──
function setActiveUnit(unit) {
  document.querySelectorAll('.unit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === unit)
  })
}

document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveUnit(btn.dataset.unit)
    schedulePreviewUpdate()
  })
})

function getUnit() {
  return document.querySelector('.unit-btn.active')?.dataset.unit || 'rem'
}

// ── 格式选择 ──
function setActiveFormat(fmt) {
  document.querySelectorAll('.fmt-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fmt === fmt)
  })
  currentFormat = fmt
}

document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveFormat(btn.dataset.fmt)
    renderPreview()
  })
})

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active')
  })
})

// ── 实时参数变化监听 ──
function schedulePreviewUpdate() {
  if (editableLayers.length === 0) return
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    regenerateAll()
    renderPreview()
  }, 300)
}

document.getElementById('divisor').addEventListener('input', schedulePreviewUpdate)
document.getElementById('prefix').addEventListener('input', schedulePreviewUpdate)
document.getElementById('layerMode').addEventListener('change', () => {
  if (currentFiles.length > 0) reparse()
})

// ── 拖拽上传 ──
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over') })
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'))
dropZone.addEventListener('drop', e => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')
  const files = [...e.dataTransfer.files].filter(f => /\.(psd|psb)$/i.test(f.name))
  if (files.length) loadFiles(files)
  else showError('请上传 .psd 或 .psb 格式的文件')
})
fileInput.addEventListener('change', e => {
  const files = [...e.target.files]
  if (files.length) loadFiles(files)
})
reselectEl.addEventListener('click', e => {
  e.stopPropagation()
  fileInput.value = ''
  fileInput.click()
})

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function loadFiles(files) {
  currentFiles = files
  errorMsg.style.display = 'none'
  resultArea.style.display = 'none'

  dropDefault.style.display = 'none'
  fileInfoEl.style.display = 'block'
  reselectEl.style.display = 'block'
  fileInput.style.pointerEvents = 'none'
  dropZone.classList.add('has-file')

  fileListEl.innerHTML = files.map(f => `
    <div class="file-item">
      <span class="file-item-icon">📄</span>
      <div>
        <div class="file-item-name">${escapeHtml(f.name)}</div>
        <div class="file-item-size">${formatSize(f.size)}</div>
      </div>
    </div>
  `).join('')

  configPanel.classList.add('visible')
  setStep(2)
}

// ── 重新解析（layerMode 变化时） ──
async function reparse() {
  if (currentFiles.length === 0) return
  showProgress(10, '重新解析图层...')
  parsedLayers = []
  const mode = document.getElementById('layerMode').value
  for (const file of currentFiles) {
    const buf = await file.arrayBuffer()
    const psd = readPsd(buf, { skipLayerImageData: false, skipCompositeImageData: true })
    collectLayers(psd.children || [], parsedLayers, mode, file.name)
  }
  buildEditableList()
  renderLayerTable()
  regenerateAll()
  renderPreview()
  showProgress(100, '完成')
  setTimeout(() => { progressArea.style.display = 'none' }, 300)
}

// ── 生成按钮 ──
btnGenerate.addEventListener('click', async () => {
  if (!currentFiles.length) return
  await doGenerate()
})

async function doGenerate() {
  errorMsg.style.display = 'none'
  configPanel.classList.remove('visible')
  resultArea.style.display = 'none'
  btnGenerate.disabled = true
  showProgress(10, '读取文件...')

  try {
    parsedLayers = []
    const mode = document.getElementById('layerMode').value

    for (let i = 0; i < currentFiles.length; i++) {
      const file = currentFiles[i]
      showProgress(10 + Math.round((i / currentFiles.length) * 60), `解析 ${file.name}...`)
      const buf = await file.arrayBuffer()
      const psd = readPsd(buf, { skipLayerImageData: false, skipCompositeImageData: true })
      collectLayers(psd.children || [], parsedLayers, mode, file.name)
    }

    showProgress(75, '构建图层列表...')
    buildEditableList()

    showProgress(90, '生成代码...')
    regenerateAll()

    showProgress(100, '完成')

    // 保存配置
    saveConfig({
      layerMode: mode,
      prefix: document.getElementById('prefix').value,
      divisor: parseFloat(document.getElementById('divisor').value) || 100,
      unit: getUnit(),
      format: currentFormat
    })

    setTimeout(() => {
      progressArea.style.display = 'none'
      renderLayerTable()
      renderPreview()
      resultArea.style.display = 'block'
      btnGenerate.disabled = false
      setStep(3)
    }, 300)

  } catch (err) {
    console.error(err)
    showError('解析失败：' + err.message)
    configPanel.classList.add('visible')
    btnGenerate.disabled = false
    setStep(2)
  }
}

// ── 构建可编辑图层列表 ──
function buildEditableList() {
  editableLayers = parsedLayers.map((l, i) => ({
    ...l,
    id: i,
    checked: true,
    customName: ''  // 空表示用原始名
  }))
  const prefix = document.getElementById('prefix').value
  const divisor = parseFloat(document.getElementById('divisor').value) || 100
  const unit = getUnit()
  resultMeta.textContent = `共 ${editableLayers.length} 个图层 · 基数 ÷${divisor} · ${unit}`
}

// ── 渲染图层编辑表格 ──
function renderLayerTable() {
  const prefix = document.getElementById('prefix').value
  layerTable.innerHTML = `
    <div class="table-header">
      <label class="check-all-wrap">
        <input type="checkbox" id="checkAll" checked />
        <span>全选</span>
      </label>
      <span class="th-name">图层名</span>
      <span class="th-class">CSS 类名（可编辑）</span>
      <span class="th-thumb">缩略图</span>
      <span class="th-size">尺寸</span>
    </div>
    <div class="table-body" id="tableBody"></div>
  `

  const body = document.getElementById('tableBody')
  body.innerHTML = editableLayers.map(l => {
    const cls = sanitizeClassName((l.customName || prefix + l.name))
    const thumbSrc = l.thumbnail || ''
    return `
      <div class="table-row" data-id="${l.id}">
        <input type="checkbox" class="row-check" ${l.checked ? 'checked' : ''} />
        <span class="row-origname" title="${escapeHtml(l.source || '')}">
          ${escapeHtml(l.name)}
        </span>
        <input class="row-classname" type="text" value="${escapeHtml(cls)}" placeholder="${escapeHtml(cls)}" />
        <div class="row-thumb">
          ${thumbSrc ? `<img src="${thumbSrc}" alt="" />` : '<span class="no-thumb">-</span>'}
        </div>
        <span class="row-size">${l.w}×${l.h}</span>
      </div>
    `
  }).join('')

  // 全选
  document.getElementById('checkAll').addEventListener('change', e => {
    const checked = e.target.checked
    editableLayers.forEach(l => l.checked = checked)
    body.querySelectorAll('.row-check').forEach(cb => cb.checked = checked)
    schedulePreviewUpdate()
  })

  // 单行勾选
  body.addEventListener('change', e => {
    if (e.target.classList.contains('row-check')) {
      const id = +e.target.closest('.table-row').dataset.id
      editableLayers[id].checked = e.target.checked
      schedulePreviewUpdate()
    }
  })

  // 类名编辑
  body.addEventListener('input', e => {
    if (e.target.classList.contains('row-classname')) {
      const id = +e.target.closest('.table-row').dataset.id
      editableLayers[id].customName = e.target.value
      schedulePreviewUpdate()
    }
  })
}

// ── 重新生成所有格式 ──
function regenerateAll() {
  const divisor = parseFloat(document.getElementById('divisor').value) || 100
  const prefix  = document.getElementById('prefix').value
  const unit    = getUnit()
  const selected = editableLayers.filter(l => l.checked)

  generatedOutput.css  = generateCSS(selected, { divisor, prefix, unit })
  generatedOutput.json = generateJSON(selected, { divisor, prefix, unit })
  generatedOutput.scss = generateSCSS(selected, { divisor, prefix, unit })
  generatedOutput.wxss = generateWXSS(selected, { divisor, prefix, unit })
}

// ── 渲染预览 ──
function renderPreview() {
  const code = generatedOutput[currentFormat] || ''
  if (currentFormat === 'json') {
    codePreview.innerHTML = syntaxHighlight(code, 'json')
  } else {
    codePreview.innerHTML = syntaxHighlight(code, 'css')
  }
}

// ── 复制全部 ──
document.getElementById('btnCopyAll').addEventListener('click', () => {
  const code = generatedOutput[currentFormat] || ''
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('btnCopyAll')
    btn.textContent = '已复制!'
    setTimeout(() => btn.textContent = '复制全部', 1500)
  })
})

// ── 下载 ──
btnDownload.addEventListener('click', () => {
  const code = generatedOutput[currentFormat] || ''
  if (!code) return
  const extMap = { css: 'css', json: 'json', scss: 'scss', wxss: 'wxss' }
  const mimeMap = { css: 'text/css', json: 'application/json', scss: 'text/plain', wxss: 'text/plain' }
  const baseName = currentFiles[0]?.name.replace(/\.(psd|psb)$/i, '') || 'sprite'
  const blob = new Blob([code], { type: mimeMap[currentFormat] })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}.${extMap[currentFormat]}`
  a.click()
  URL.revokeObjectURL(url)
})

// ── 重新配置 ──
btnReset.addEventListener('click', () => {
  resultArea.style.display = 'none'
  configPanel.classList.add('visible')
  setStep(2)
})

// ── 工具 ──
function showProgress(pct, text) {
  progressArea.style.display = 'block'
  progressBar.style.width = pct + '%'
  progressText.textContent = text
}

function showError(msg) {
  errorMsg.textContent = msg
  errorMsg.style.display = 'block'
  progressArea.style.display = 'none'
}

export function sanitizeClassName(name) {
  return name
    .replace(/[^\w\u4e00-\u9fa5-]/g, '_')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}
