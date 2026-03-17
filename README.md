# PSD 图层坐标导出工具

将 PSD 雪碧图中每个图层的位置和尺寸，自动导出为 CSS `background-position` 样式文件。

---

## 环境要求

- Node.js 14 及以上
- 现代浏览器（Chrome / Safari / Edge）

---

## 安装

**1. 克隆或下载项目**

```bash
git clone <项目地址>
cd <项目目录>
```

**2. 安装依赖**

```bash
npm install
```

**3. 启动本地服务器**

```bash
# 使用 Python（推荐，无需额外安装）
python3 -m http.server 8765

# 或使用 Node.js
npx serve .
```

**4. 打开浏览器访问**

```
http://localhost:8765
```

> 注意：必须通过 HTTP 服务器访问，不能直接双击打开 `index.html`，否则本地文件加载会被浏览器安全策略拦截。

---

## 使用步骤

### 第一步：上传 PSD 文件

- 将 PSD 文件**拖拽**到上传区域，或点击上传区域**选择文件**
- 上传成功后显示文件名和大小
- 如需更换文件，点击「重新选择文件」

### 第二步：配置参数

上传成功后，配置面板自动展开，共有四个参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| **图层范围** | 控制导出哪些图层 | 所有图层 |
| **CSS 类名前缀** | 生成的 CSS 类名前缀 | `sprite-` |
| **除数基数** | 像素值除以此数得到最终数值 | `100` |
| **单位** | 输出的 CSS 单位 | `rem` |

#### 图层范围说明

- **所有图层（含组内）**：递归导出所有图层，包括图层组内的子图层，自动跳过隐藏图层
- **仅可见图层**：同上，仅导出当前可见的图层
- **仅顶层图层**：只导出 PSD 最顶层的图层，不进入图层组内部

#### 除数基数说明

像素坐标值会除以基数，得到最终输出数值：

```
输出值 = 原始像素值 ÷ 基数
```

| 设计稿类型 | 建议基数 |
|-----------|---------|
| Web 1x 稿 | `1`（单位用 px）|
| 移动端 750px 稿 | `100`（单位用 rem，1rem = 100px）|
| 移动端 375px 稿 | `50` |
| 自定义 | 按实际换算关系填写 |

#### 单位说明

支持 `rem` / `px` / `vw` / `em` 四种单位，点击切换。

- `px`：基数建议填 `1`，直接输出原始像素值
- `rem`：配合移动端 flexible 方案使用，基数填根元素 font-size 对应的像素数
- `vw`：基数填设计稿宽度，如 `750`
- `em`：相对父元素字号，较少用于雪碧图

### 第三步：生成并导出

点击「**生成 CSS**」按钮，工具自动解析并生成：

- **CSS 预览**：带语法高亮的代码预览
- **图层列表**：每个图层的宽高和 background-position 值
- 点击「**下载 CSS**」保存文件，文件名与 PSD 文件名一致

---

## 输出格式

生成的 CSS 格式如下：

```css
/* 源文件: icons.psd  画布: 400×400px */
/* 图层数: 12  基数: ÷100  单位: rem  生成: 2026/3/17 */

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

.sprite-icon_user {
  width: 0.48rem;
  height: 0.48rem;
  background-position: -0.96rem 0;
}
```

### 在项目中使用

```css
/* 在你的 CSS 中引入导出的文件 */
@import './sprite-icons.css';

/* 使用时指定背景图 */
.icon {
  background-image: url('./sprite.png');
  background-repeat: no-repeat;
  background-size: /* 根据实际尺寸填写 */;
  display: inline-block;
}
```

```html
<!-- HTML 中使用 -->
<i class="icon sprite-icon_home"></i>
<i class="icon sprite-icon_search"></i>
```

---

## 注意事项

1. **隐藏图层不导出**：PSD 中设为隐藏的图层会自动跳过
2. **空图层不导出**：宽或高为 0 的图层自动跳过
3. **类名特殊字符**：图层名中的特殊字符会自动转换为下划线 `_`，数字开头会加前缀 `_`
4. **坐标为 0 时**：`background-position` 输出 `0` 而非 `0rem`，符合 CSS 规范
5. **文件安全**：PSD 文件在本地浏览器内解析，不会上传到任何服务器

---

## 目录结构

```
.
├── index.html          # 主页面
├── package.json
├── node_modules/
│   └── ag-psd/         # PSD 解析库
└── README.md           # 本文档
```

---

## 依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| [ag-psd](https://github.com/Agamnentzar/ag-psd) | latest | PSD 文件解析 |

---

## 常见问题

**Q：上传后提示「解析失败」**

- 确认文件是标准 PSD 格式（非 PSB 大文件格式）
- 尝试在 Photoshop 中另存为 PSD 后重新上传
- 检查浏览器控制台（F12）查看详细错误信息

**Q：导出的图层数量和预期不符**

- 检查图层范围设置，默认「所有图层」会跳过隐藏图层
- PSD 中被隐藏的图层不会导出

**Q：类名出现乱码或 `_`**

- 图层名包含空格、括号等特殊字符时会被替换为 `_`
- 建议在 PSD 中将图层命名为英文字母 + 数字 + 下划线格式

**Q：必须用 HTTP 服务器，能不能直接打开 HTML？**

- 不能，浏览器安全策略禁止本地 HTML 加载本地 JS 模块
- 最简单的方案是用 `python3 -m http.server 8765` 启动服务
