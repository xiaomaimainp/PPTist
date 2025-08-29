export interface FileImportOptions {
  content: string
  fileType: 'json' | 'markdown'
  template: string
  customPrompt?: string
}

export interface FileImportResult {
  outline: string
  success: boolean
}

export const generatePPTFromFile = (options: FileImportOptions): Promise<FileImportResult> => {
  const { content, fileType, template, customPrompt } = options
  
  try {
    let outline = ''
    
    if (fileType === 'json') {
      outline = parseJSONToOutline(content, customPrompt)
    }
    else if (fileType === 'markdown') {
      outline = parseMarkdownToOutline(content, customPrompt)
    }
    
    return Promise.resolve({
      outline,
      success: true
    })
  }
  catch (error) {
    return Promise.reject(new Error('文件解析失败'))
  }
}

const parseJSONToOutline = (content: string, customPrompt?: string): string => {
  try {
    const data = JSON.parse(content)
    
    // 处理ASR数据
    if (data.segments && Array.isArray(data.segments)) {
      const text = data.segments.map((seg: any) => seg.text || '').join(' ')
      return generateOutlineFromText(text, customPrompt)
    }
    
    // 处理结构化数据
    if (data.title) {
      const description = data.description || ''
      return generateOutlineFromStructuredData(data.title, description, customPrompt)
    }
    
    // 通用JSON处理
    const jsonStr = JSON.stringify(data, null, 2)
    return generateOutlineFromText(jsonStr, customPrompt)
  }
  catch (error) {
    throw new Error('JSON格式错误')
  }
}

const parseMarkdownToOutline = (content: string, customPrompt?: string): string => {
  // 如果Markdown已经包含标题结构，直接使用
  if (content.includes('# ') || content.includes('## ')) {
    return content
  }
  
  // 否则从内容生成大纲
  const lines = content.split('\n').filter(line => line.trim())
  const title = lines[0] || '未命名主题'
  
  return generateOutlineFromText(content, customPrompt, title)
}

const generateOutlineFromText = (text: string, customPrompt?: string, title?: string): string => {
  // 简单的大纲生成逻辑
  const mainTitle = title || '基于文件内容的演示'
  const summary = text.substring(0, 100) + (text.length > 100 ? '...' : '')
  
  return `# ${mainTitle}

## 概述
${summary}

## 主要内容
- 要点一
- 要点二
- 要点三

## 总结
基于提供的内容生成的演示大纲

${customPrompt ? `\n## 自定义要求\n${customPrompt}` : ''}`
}

const generateOutlineFromStructuredData = (title: string, description: string, customPrompt?: string): string => {
  return `# ${title}

## 简介
${description || '暂无描述'}

## 主要内容
- 核心概念
- 实施方案
- 预期效果

## 结论
${title}的总结与展望

${customPrompt ? `\n## 自定义要求\n${customPrompt}` : ''}`
}