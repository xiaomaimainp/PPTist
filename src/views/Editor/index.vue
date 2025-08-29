<template>
  <div class="pptist-editor">
    <EditorHeader class="layout-header" @triggerAIPPT="handleTriggerAIPPT" />
    <div class="layout-content">
      <Thumbnails class="layout-content-left" />
      <div class="layout-content-center">
        <CanvasTool class="center-top" />
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight + 40}px)` }" />
        <Remark
          class="center-bottom" 
          v-model:height="remarkHeight" 
          :style="{ height: `${remarkHeight}px` }"
        />
      </div>
      <Toolbar class="layout-content-right" />
    </div>
  </div>

  <SelectPanel v-if="showSelectPanel" />
  <SearchPanel v-if="showSearchPanel" />
  <NotesPanel v-if="showNotesPanel" />
  <MarkupPanel v-if="showMarkupPanel" />
  <SymbolPanel v-if="showSymbolPanel" />

  <Modal
    :visible="!!dialogForExport" 
    :width="680"
    @closed="closeExportDialog()"
  >
    <ExportDialog />
  </Modal>

  <Modal
    :visible="showAIPPTDialog" 
    :width="720"
    :closeOnClickMask="false"
    :closeOnEsc="false"
    closeButton
    @closed="closeAIPPTDialog()"
  >
    <AIPPTDialog :initialKeyword="aipptKeyword" :initialOutline="aipptOutline" />
  </Modal>

  <FileImportDialog 
    v-model:visible="fileImportDialogVisible" 
    @success="handleFileImportSuccess"
    @triggerAIPPT="handleTriggerAIPPT"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'

import EditorHeader from './EditorHeader/index.vue'
import Canvas from './Canvas/index.vue'
import CanvasTool from './CanvasTool/index.vue'
import Thumbnails from './Thumbnails/index.vue'
import Toolbar from './Toolbar/index.vue'
import Remark from './Remark/index.vue'
import ExportDialog from './ExportDialog/index.vue'
import SelectPanel from './SelectPanel.vue'
import SearchPanel from './SearchPanel.vue'
import NotesPanel from './NotesPanel.vue'
import SymbolPanel from './SymbolPanel.vue'
import MarkupPanel from './MarkupPanel.vue'
import AIPPTDialog from './AIPPTDialog.vue'
import FileImportDialog from './FileImportDialog.vue'
import Modal from '@/components/Modal.vue'

const mainStore = useMainStore()
const { dialogForExport, showSelectPanel, showSearchPanel, showNotesPanel, showSymbolPanel, showMarkupPanel, showAIPPTDialog } = storeToRefs(mainStore)

const closeExportDialog = () => mainStore.setDialogForExport('')
const closeAIPPTDialog = () => mainStore.setAIPPTDialogState(false)

const fileImportDialogVisible = ref(false)
const handleFileImportSuccess = (data: any) => {
  console.log('文件导入成功:', data)
  // 处理文件导入成功后的逻辑
}

// 处理文件导入触发AIPPT的逻辑
const aipptKeyword = ref('')
const aipptOutline = ref('')
const handleTriggerAIPPT = (content: string) => {
  // 判断内容是否为大纲格式（包含markdown标题）
  if (content.includes('# ') || content.includes('## ')) {
    // 如果是大纲内容，直接设置大纲
    aipptOutline.value = content
    aipptKeyword.value = ''
  }
  else {
    // 如果是关键词，设置关键词
    aipptKeyword.value = content
    aipptOutline.value = ''
  }
  // 打开AIPPT对话框
  mainStore.setAIPPTDialogState(true)
}

const remarkHeight = ref(40)

useGlobalHotkey()
usePasteEvent()
</script>

<style lang="scss" scoped>
.pptist-editor {
  height: 100%;
}
.layout-header {
  height: 40px;
}
.layout-content {
  height: calc(100% - 40px);
  display: flex;
}
.layout-content-left {
  width: 160px;
  height: 100%;
  flex-shrink: 0;
}
.layout-content-center {
  width: calc(100% - 160px - 260px);

  .center-top {
    height: 40px;
  }
}
.layout-content-right {
  width: 260px;
  height: 100%;
}
</style>