<template>
  <el-card
      ref="panelRef"
      v-if="visible"
      :class="['gui-panel', customClass]"
      :style="panelStyle"
      shadow="never"
      body-style="padding: 0;"
      @mousedown="startDrag"

  >
    <el-button class="collapse-btn" @click.stop="panelClose" size="small" style="padding-bottom: 10px" text>
      <el-icon><Minus /></el-icon>
    </el-button >
    <GuiGroup v-for="(ui, index) in model" :key="index" :model="ui" />
  </el-card>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import GuiGroup from './GuiGroup.vue'
import { ElIcon } from 'element-plus'
import { Minus } from '@element-plus/icons-vue'

const props = defineProps({
  style: Object,
  customClass: String,
  model: Array,
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible'])

function panelClose() {
  emit('update:visible',false)
}

const panelRef = ref(null)
const panelStyle = reactive({
  position: 'absolute',
  top: '20px',
  left: '20px'
})

let startX, startY, startTop, startLeft
let dragging = false

function startDrag(e) {
  if (e.button !== 0) return // only left click
  dragging = true
  startX = e.clientX
  startY = e.clientY
  startTop = parseFloat(panelStyle.top)
  startLeft = parseFloat(panelStyle.left)
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', stopDrag)
}

function onDragging(e) {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  panelStyle.top = `${startTop + dy}px`
  panelStyle.left = `${startLeft + dx}px`
}

function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.gui-panel {
  width: 300px;
  height: 75vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 16px;
  font-size: 14px;
  z-index: 100;
  border: none;
  user-select: none;
  cursor: move;
}
.collapse-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 102;
}
</style>