/**
 * 将任意字符串转换为合法的 CSS 类名
 */
export function sanitizeClassName(name) {
  return name
    .replace(/[^\w\u4e00-\u9fa5-]/g, '_')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}
