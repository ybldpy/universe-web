<template>
  <el-card
      ref="panelRef"
      v-show="visible"
      :class="'gui-panel'"
      :style="panelStyle"
      shadow="never"
      body-style="padding: 0;"
      @mousedown="startDrag"
  >
    <el-button class="collapse-btn" @click.stop="panelClose" size="small" text>
      <el-icon><Minus /></el-icon>
    </el-button>

    <el-form :style="{marginTop:'20px'}">
      <el-form-item label="Focus Node">
        <el-select :model-value="focusNode" @update:modelValue="(val)=>{emit('update:focusNode', val)}">
          <el-option v-for="name in nodeIdentifiers" :key="name" :value="name" :label="name.charAt(0).toUpperCase() + name.slice(1)"/>
        </el-select>
      </el-form-item>

      <el-form-item label="Scene" label-position="top" :style="{width:'100%'}">
        <GuiGroup v-for="(ui, index) in nodesProps"  :model="ui" />
      </el-form-item>
    </el-form>

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
  nodesProps: Array,
  nodeIdentifiers: Array,
  focusNode: String,
  visible: Boolean
})


console.log(props.nodesProps)

const emit = defineEmits(['update:visible','update:focusNode'])

function panelClose() {
  emit('update:visible',false)
}

const panelRef = ref(null)
const panelStyle = reactive({
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
  position: fixed;
  width: 20%;
  height: 75%;
  overflow-y: auto;
  background:#E3E3E3;
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
  margin-bottom: 30px;
  z-index: 102;
}
</style>