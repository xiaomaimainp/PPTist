<template>
  <Modal v-model:visible="dialogVisible" :width="800" :closeButton="true">
    <div v-if="dialogVisible">
      <div class="dialog-title">
        📁 导入文件生成PPT
      </div>

      <div class="import-content">
      <div class="file-upload-section">
        <div class="upload-types">
          <div class="upload-type" :class="{ active: activeTab === 'json' }" @click="activeTab = 'json'">
            <span>📄 JSON文件</span>
          </div>
          <div class="upload-type" :class="{ active: activeTab === 'markdown' }" @click="activeTab = 'markdown'">
            <span>📝 Markdown文件</span>
          </div>
        </div>

        <div class="file-input-area">
          <input 
            ref="fileInput"
            type="file" 
            :accept="activeTab === 'json' ? '.json' : '.md,.markdown'"
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div class="drop-zone" @click="triggerFileSelect" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent>
            <div class="upload-icon">☁️</div>
            <div class="upload-text">
              <p>点击选择{{ activeTab === 'json' ? 'JSON' : 'Markdown' }}文件或拖拽到此处</p>
              <p class="upload-hint">支持 {{ activeTab === 'json' ? '.json' : '.md, .markdown' }} 格式</p>
            </div>
          </div>

          <div v-if="selectedFile" class="selected-file">
            📎 {{ selectedFile.name }}
            <Button size="small" @click="removeFile">移除</Button>
          </div>
        </div>

        <div class="file-preview" v-if="fileContent">
          <div class="preview-header">
            <span>文件预览</span>
            <Button size="small" @click="fileContent = ''">清除</Button>
          </div>
          <div class="preview-content">
            <pre v-if="activeTab === 'json'">{{ formatJSON(fileContent) }}</pre>
            <div v-else class="markdown-preview">{{ fileContent }}</div>
          </div>
        </div>
      </div>

      <div class="generation-options">
        <div class="option-group">
          <label>生成模式：</label>
          <RadioGroup v-model:value="generationMode">
            <RadioButton value="auto">自动解析</RadioButton>
            <RadioButton value="custom">自定义提示</RadioButton>
          </RadioGroup>
        </div>

        <div v-if="generationMode === 'custom'" class="custom-prompt">
          <label>自定义提示词：</label>
          <TextArea 
            v-model:value="customPrompt" 
            placeholder="请输入如何处理文件内容的提示词..."
            :rows="3"
          />
        </div>

        <div class="option-group">
          <label>PPT模板：</label>
          <Select 
            v-model:value="selectedTemplate" 
            style="width: 200px"
            :options="[
              { label: '商务模板', value: 'business' },
              { label: '学术模板', value: 'academic' },
              { label: '创意模板', value: 'creative' },
              { label: '简约模板', value: 'simple' }
            ]"
          />
        </div>
      </div>

      <div class="action-buttons">
        <Button @click="dialogVisible = false">取消</Button>
        <Button 
          type="primary" 
          :disabled="!fileContent || generating"
          @click="generatePPT"
        >
          {{ generating ? '生成中...' : '生成PPT' }}
        </Button>
      </div>
    </div>

    <FullscreenSpin :loading="generating" tip="AI生成中，请耐心等待..." />
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import Modal from '@/components/Modal.vue'
import Button from '@/components/Button.vue'
import RadioGroup from '@/components/RadioGroup.vue'
import RadioButton from '@/components/RadioButton.vue'
import TextArea from '@/components/TextArea.vue'
import Select from '@/components/Select.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import message from '@/utils/message'
import { generatePPTFromFile, type FileImportOptions } from '../../services/fileImport'

interface Props {
  visible: boolean
}

interface Emits {
  (event: 'update:visible', visible: boolean): void
  (event: 'success', data: any): void
  (event: 'triggerAIPPT', content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const activeTab = ref<'json' | 'markdown'>('json')
const selectedFile = ref<File | null>(null)
const fileContent = ref('')
const generationMode = ref('auto')
const customPrompt = ref('')
const selectedTemplate = ref('business')
const generating = ref(false)
const fileInput = ref<HTMLInputElement>()

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = async (file: File) => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  
  // 验证文件类型
  if (activeTab.value === 'json' && fileExtension !== 'json') {
    message.error('请选择JSON文件')
    return
  }
  
  if (activeTab.value === 'markdown' && !['md', 'markdown'].includes(fileExtension || '')) {
    message.error('请选择Markdown文件')
    return
  }

  selectedFile.value = file
  
  try {
    const text = await file.text()
    fileContent.value = text
    
    // 验证JSON格式
    if (activeTab.value === 'json') {
      try {
        JSON.parse(text)
      }
      catch (error) {
        message.error('JSON文件格式错误')
        return
      }
    }
    
    message.success('文件读取成功')
  }
  catch (error) {
    message.error('文件读取失败')
  }
}

const removeFile = () => {
  selectedFile.value = null
  fileContent.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatJSON = (jsonString: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2)
  }
  catch {
    return jsonString
  }
}

const generatePPT = async () => {
  if (!fileContent.value) {
    message.error('请先上传文件')
    return
  }

  generating.value = true

  try {
    const options: FileImportOptions = {
      content: fileContent.value,
      fileType: activeTab.value,
      template: selectedTemplate.value,
      customPrompt: generationMode.value === 'custom' ? customPrompt.value : undefined
    }

    const result = await generatePPTFromFile(options)
    
    // 关闭文件导入对话框
    dialogVisible.value = false
    
    // 触发AIPPT对话框并传递生成的大纲
    emit('triggerAIPPT', result.outline)
    message.success('文件解析成功，请确认大纲内容')
  }
  catch (error) {
    message.error('文件导入失败，请检查文件格式')
  }
  finally {
    generating.value = false
  }
}

// 解析JSON文件内容为主题描述
const parseJSONContent = (content: string): string => {
  try {
    const data = JSON.parse(content)
    
    // 处理ASR数据
    if (data.segments && Array.isArray(data.segments)) {
      const text = data.segments.map((seg: any) => seg.text || '').join(' ')
      return `基于以下内容生成PPT：${text.substring(0, 200)}...`
    }
    
    // 处理结构化数据
    if (data.title) {
      return `${data.title}${data.description ? '：' + data.description : ''}`
    }
    
    // 通用JSON处理
    const jsonStr = JSON.stringify(data, null, 2)
    return `基于以下数据生成PPT：${jsonStr.substring(0, 200)}...`
  }
  catch (error) {
    return ''
  }
}

// 解析Markdown内容为主题描述
const parseMarkdownContent = (content: string): string => {
  const lines = content.split('\n')
  const title = lines.find(line => line.startsWith('# '))?.replace('# ', '') || ''
  const description = lines.slice(0, 10).join(' ').substring(0, 200)
  
  return title ? `${title}：${description}` : `基于以下内容生成PPT：${description}`
}
</script>

<style lang="scss" scoped>
.dialog-title {
  font-size: 18px;
  font-weight: 600;
}

.import-content {
  .file-upload-section {
    margin-bottom: 24px;
    
    .upload-types {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      
      .upload-type {
        padding: 8px 16px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          border-color: $themeColor;
        }
        
        &.active {
          border-color: $themeColor;
          background-color: rgba($themeColor, 0.1);
          color: $themeColor;
        }
      }
    }
    
    .file-input-area {
      .drop-zone {
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          border-color: $themeColor;
          background-color: rgba($themeColor, 0.02);
        }
        
        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .upload-text {
          p {
            margin: 0;
            
            &.upload-hint {
              font-size: 12px;
              color: #999;
              margin-top: 4px;
            }
          }
        }
      }
      
      .selected-file {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: #f5f5f5;
        border-radius: 6px;
        margin-top: 12px;
      }
    }
    
    .file-preview {
      margin-top: 16px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      
      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: #fafafa;
        border-bottom: 1px solid #d9d9d9;
      }
      
      .preview-content {
        max-height: 300px;
        overflow-y: auto;
        padding: 16px;
        
        pre {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
        }
        
        .markdown-preview {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
      }
    }
  }
  
  .generation-options {
    margin-bottom: 24px;
    
    .option-group {
      margin-bottom: 16px;
      
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }
    
    .custom-prompt {
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>