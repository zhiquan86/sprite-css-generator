# PSD Sprite CSS Generator

将 PSD 雪碧图中每个图层的位置和尺寸，自动导出为 CSS / SCSS / WXSS / JSON 样式文件。

## 在线使用

**无需安装，直接打开浏览器使用：**

👉 **https://zhiquan86.github.io/sprite-css-generator/**

---

## 本地运行

如需本地开发或离线使用：

**1. 克隆项目**

```bash
git clone https://github.com/zhiquan86/sprite-css-generator.git
cd sprite-css-generator
```

**2. 安装依赖**

```bash
npm install
```

**3. 启动开发服务器**

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`

> **注意**：必须用 `npm run dev` 启动，不能用 `python3 -m http.server` 或直接双击打开 `index.html`。
> 根目录的 `index.html` 使用了 ES 模块语法，浏览器无法直接解析裸模块路径（如 `ag-psd`），必须经过 Vite 处理。

**4. 离线单文件版（无需服务器）**

```bash
npm run build
# 产出 dist/index.html
# 这个文件可以直接双击打开，或部署到任意静态服务器
```

---

## 使用步骤

### 第一步：上传 PSD 文件

- 将 `.psd` / `.psb` 文件**拖拽**到上传区域，或点击选择
- 支持同时上传多个文件批量处理
- 上传成功后显示文件名和大小

### 第二步：配置参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| **图层范围** | 控制导出哪些图层 | 所有图层 |
| **CSS 类名前缀** | 生成的 CSS 类名前缀 | `sprite-` |
| **除数基数** | 像素值除以此数得到最终数值 | `100` |
| **单位** | 输出的 CSS 单位 | `rem` |

#### 图层范围说明

- **所有图层（含组内）**：递归导出所有图层，自动跳过隐藏图层
- **仅可见图层**：只导出当前可见图层
- **仅顶层图层**：只导出 PSD 最顶层，不进入图层组

#### 除数基数说明

```
输出值 = 原始像素值 ÷ 基数
```

| 设计稿类型 | 建议基数 |
|-----------|---------|
| Web 1x 稿 | `1`（单位 px）|
| 移动端 750px 稿 | `100`（单位 rem）|
| 移动端 375px 稿 | `50` |

### 第三步：生成并导出

点击「**生成代码**」按钮后：

- **代码预览**：带语法高亮，支持 CSS / SCSS / WXSS / JSON 格式切换
- **图层编辑**：可勾选/取消图层、直接修改 CSS 类名、查看缩略图
- 点击「**下载文件**」保存，文件名与 PSD 文件名一致

---

## 输出格式示例

### CSS

```css
.sprite-icon_home {
  width: 0.48rem;
  height: 0.48rem;
  background-position: 0 0;
}

.sprite-icon_search {
  width: 0.48rem;
  height: 0.48rem;
  background-position: -0.48rem 0;
}
```

### SCSS

```scss
@mixin sprite($w, $h, $x, $y) {
  width: $w;
  height: $h;
  background-position: $x $y;
}

.sprite-icon_home {
  @include sprite(0.48rem, 0.48rem, 0, 0);
}
```

### JSON

```json
{
  "sprite-icon_home": {
    "width": "0.48rem",
    "height": "0.48rem",
    "background-position": "0 0"
  }
}
```

### 在项目中使用

```css
@import './sprite-icons.css';

.icon {
  background-image: url('./sprite.png');
  background-repeat: no-repeat;
  display: inline-block;
}
```

```html
<i class="icon sprite-icon_home"></i>
<i class="icon sprite-icon_search"></i>
```

---

## 功能特性

- 支持 `.psd` / `.psb` 格式
- 批量上传多个文件
- 图层缩略图预览
- 图层勾选 + CSS 类名直接编辑
- 实时参数调整，预览即时刷新
- 多格式导出：CSS / SCSS / WXSS / JSON
- 复制单条或全部代码
- localStorage 自动记忆上次配置
- 纯前端解析，文件不上传任何服务器

---

## 注意事项

1. **隐藏图层不导出**：PSD 中隐藏的图层自动跳过
2. **空图层不导出**：宽或高为 0 的图层自动跳过
3. **类名特殊字符**：图层名中的特殊字符会被替换为 `_`，数字开头加前缀 `_`
4. **坐标为 0 时**：输出 `0` 而非 `0rem`，符合 CSS 规范
5. **隐私安全**：所有解析在本地浏览器完成，不上传服务器

---

## 依赖

| 依赖 | 说明 |
|------|------|
| [ag-psd](https://github.com/Agamnentzar/ag-psd) | PSD 文件解析 |
| [Vite](https://vite.dev) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) | 构建打包 |

---

## 开源协议

MIT License — 免费使用，可商用，无需授权。
