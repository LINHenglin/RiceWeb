import jsPDF from 'jspdf'
import { markdownToHtml } from './markdown'

export const generateDiagnosisPDF = async (
  analysisResult: string,
  detectionRecordId: number,
  createTime: string,
  mergedImageUrl?: string
) => {
  try {
    // 创建一个临时容器来放置内容
    const container = document.createElement('div')
    container.style.padding = '20px'
    container.style.width = '800px'
    container.style.backgroundColor = 'white'
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    
    // 创建标题
    const titleDiv = document.createElement('h1')
    titleDiv.textContent = 'AI水稻病虫害识别报告'
    titleDiv.style.textAlign = 'center'
    titleDiv.style.marginBottom = '20px'
    titleDiv.style.fontSize = '28px'
    titleDiv.style.color = '#333'
    container.appendChild(titleDiv)
    
    // 创建基本信息
    const infoDiv = document.createElement('div')
    infoDiv.style.marginBottom = '20px'
    infoDiv.style.padding = '10px'
    infoDiv.style.backgroundColor = '#f2fbf6'
    infoDiv.style.borderRadius = '8px'
    
    const timeP = document.createElement('p')
    timeP.innerHTML = `<strong>识别时间：</strong> ${createTime}`
    timeP.style.margin = '8px 0'
    timeP.style.fontSize = '14px'
    
    const idP = document.createElement('p')
    idP.innerHTML = `<strong>记录ID：</strong> ${detectionRecordId}`
    idP.style.margin = '8px 0'
    idP.style.fontSize = '14px'
    
    infoDiv.appendChild(timeP)
    infoDiv.appendChild(idP)
    container.appendChild(infoDiv)
    
    // 添加分析结果标题
    const resultTitle = document.createElement('h2')
    resultTitle.textContent = 'AI分析结果'
    resultTitle.style.fontSize = '20px'
    resultTitle.style.marginBottom = '15px'
    resultTitle.style.marginTop = '20px'
    resultTitle.style.color = '#2b7a3f'
    container.appendChild(resultTitle)
    
    // 转换markdown为HTML并添加
    const htmlContent = markdownToHtml(analysisResult)
    const resultContent = document.createElement('div')
    resultContent.innerHTML = htmlContent
    resultContent.style.lineHeight = '1.8'
    resultContent.style.fontSize = '14px'
    resultContent.style.color = '#333'
    
    // 添加markdown HTML样式
    const style = document.createElement('style')
    style.textContent = `
      #pdf-content h1, #pdf-content h2, #pdf-content h3, 
      #pdf-content h4, #pdf-content h5, #pdf-content h6 {
        margin: 12px 0 8px 0;
        font-weight: 600;
        color: #333;
      }
      #pdf-content h1 { font-size: 18px; }
      #pdf-content h2 { font-size: 16px; }
      #pdf-content h3 { font-size: 15px; }
      #pdf-content h4, #pdf-content h5, #pdf-content h6 { font-size: 14px; }
      #pdf-content p { margin: 8px 0; }
      #pdf-content ul, #pdf-content ol { margin: 8px 0; padding-left: 24px; }
      #pdf-content li { margin: 4px 0; }
      #pdf-content strong { font-weight: 600; }
      #pdf-content em { font-style: italic; }
      #pdf-content code { background: #e8eaed; padding: 2px 6px; border-radius: 3px; }
      #pdf-content pre { background: #e8eaed; padding: 12px; border-radius: 4px; overflow-x: auto; }
      #pdf-content blockquote { border-left: 4px solid #7ed6d4; padding-left: 12px; margin: 8px 0; }
      #pdf-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
      #pdf-content th, #pdf-content td { border: 1px solid #ddd; padding: 8px 12px; }
      #pdf-content th { background: #f5f7fa; font-weight: 600; }
    `
    document.head.appendChild(style)
    
    resultContent.id = 'pdf-content'
    container.appendChild(resultContent)
    
    // 添加到body中（隐藏）
    document.body.appendChild(container)
    
    // 使用html2canvas转换为图片
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true
    })
    
    // 移除临时容器和样式
    document.body.removeChild(container)
    document.head.removeChild(style)
    
    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // 获取canvas的尺寸
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - 2 * margin
    
    // 计算缩放比例
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const pageData = canvas.toDataURL('image/png')
    
    let heightLeft = imgHeight
    let position = 0
    
    // 添加第一页
    pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, imgHeight)
    heightLeft -= (pageHeight - 2 * margin)
    
    // 添加后续页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(pageData, 'PNG', margin, position + margin, imgWidth, imgHeight)
      heightLeft -= (pageHeight - 2 * margin)
    }
    
    // 添加合并图像URL到PDF最后
    if (mergedImageUrl) {
      pdf.addPage()
      pdf.setFontSize(14)
      pdf.text('合并图像URL', margin, margin + 5)
      pdf.setFontSize(12)
      pdf.setTextColor(0, 102, 204)
      pdf.textWithLink(mergedImageUrl, margin, margin + 15, { pageNumber: undefined, zoom: undefined })
      // 重置文字颜色
      pdf.setTextColor(0, 0, 0)
    }
    
    // 下载PDF
    const fileName = `水稻病虫害识别报告_${detectionRecordId}_${new Date().getTime()}.pdf`
    pdf.save(fileName)
    
  } catch (error) {
    console.error('生成PDF失败:', error)
    throw error
  }
}
