import { marked } from 'marked'

// 配置marked选项
marked.setOptions({
  breaks: true, // 将\n转换为<br>
  gfm: true, // 使用GitHub风格markdown
})

/**
 * 将markdown文本转换为HTML
 * @param markdown markdown格式的文本
 * @returns HTML字符串
 */
export const markdownToHtml = (markdown: string): string => {
  try {
    return marked.parse(markdown) as string
  } catch (error) {
    console.error('Markdown转换错误:', error)
    return markdown // 如果转换失败，返回原文本
  }
}

/**
 * 转义HTML特殊字符
 * @param text 需要转义的文本
 * @returns 转义后的文本
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}
