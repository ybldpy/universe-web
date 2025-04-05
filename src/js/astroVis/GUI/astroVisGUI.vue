<template>

  <ScenePanel :model="model" class="gui-panel" v-model:visible="scenePanelVisible"></ScenePanel>

  <div class="floating-toolbar">
    <el-button
        v-for="btn in buttons"
        :key="btn.icon.name"
        :title="btn.title"
        circle
        @click="btn.action"
        class="toolbar-btn"
    >
      <el-icon><component :is="btn.icon" /></el-icon>
    </el-button>
  </div>

</template>

<script setup>
import { reactive,ref} from 'vue'
import ScenePanel from "./ScenePanel.vue";
const scenePanelVisible = ref(false)
defineProps({
  model:Array
})

import {
  InfoFilled,
  SwitchFilled,
  Top,
  View,
} from '@element-plus/icons-vue'

const buttons = [
  {
    title: '信息',
    icon: InfoFilled,
    active: false,
    action: () => console.log('信息按钮点击')
  },
  {
    title: '调节参数',
    icon: SwitchFilled,
    active: false,
    action: () => scenePanelVisible.value = true
  },
  {
    title: '回到顶部',
    icon: Top,
    active: true,
    action: () => console.log('回到顶部按钮点击')
  },
  {
    title: '隐藏视图',
    icon: View,
    active: false,
    action: () => console.log('隐藏视图按钮点击')
  }
]






</script>

<style scoped>

.floating-toolbar {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 999;
}

.toolbar-btn {
  background-color: #2c2c3e;
  color: #fff;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.toolbar-btn:hover {
  border-color: #00c8ff;
}

.toolbar-btn.active {
  border-color: #00c8ff;
}



</style>







