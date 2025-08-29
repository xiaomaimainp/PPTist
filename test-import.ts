// 临时测试文件
import { generatePPTFromFile, type FileImportOptions } from './src/services/fileImport'

// 测试用例
const testOptions: FileImportOptions = {
  content: '{"title": "测试PPT", "sections": [{"title": "第一章", "content": ["内容1", "内容2"]}]}',
  fileType: 'json',
  template: 'default'
}

// 测试函数调用
generatePPTFromFile(testOptions).then(result => {
  console.log('导入测试成功', result)
}).catch(error => {
  console.error('导入测试失败', error)
})

console.log('导入模块成功')