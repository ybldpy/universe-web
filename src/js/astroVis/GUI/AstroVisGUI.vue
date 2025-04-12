<template>

    <ScenePanel :model="model" class="gui-panel" v-model:visible="scenePanelVisible"></ScenePanel>


<!--  <Instruction @instruction-complete="instructionShow = false;localStorage.setItem('instructionComplete','yes')" v-if="instructionShow"></Instruction>-->
  <PlanetNavigator :planets="planets" :focus="focus" @planet-select="select => {focus = select}"></PlanetNavigator>
  <ToolBar @upload-click="moveToUpload" @setting-click="scenePanelVisible = true"></ToolBar>

</template>

<script setup>
import { reactive,ref} from 'vue'
import ScenePanel from "./ScenePanel.vue";
const scenePanelVisible = ref(false)
defineProps({
  model:Array,
})

import {
  InfoFilled,
  SwitchFilled,
  Top,
  View,
} from '@element-plus/icons-vue'
import Instruction from "./Instruction.vue";
import PlanetNavigator from "./PlanetNavigator.vue";
import ToolBar from "./ToolBar.vue";


const planets = [
  {
    name:"Earth",
    imageUrl: "/data/asset/astroVisGUI/Planets/Earth.png",
  },
  {
    name: "Jupiter",
    imageUrl: "/data/asset/astroVisGUI/Planets/Jupiter.png",
  },
  {
    Mars: "Mars",
    imageUrl: "/data/asset/astroVisGUI/Planets/Mars.png",
  },
  {
    name: "Mercury",
    imageUrl: "/data/asset/astroVisGUI/Planets/Mercury.png",
  },
  {
    name:"Neptune",
    imageUrl: "/data/asset/astroVisGUI/Planets/Neptune.png",
  },
  {
    name:"Pluto",
    imageUrl: "/data/asset/astroVisGUI/Planets/Pluto.png",
  },
  {
    name:"Saturn",
    imageUrl: "/data/asset/astroVisGUI/Planets/Saturn.png",
  },
  {
    name:"Uranus",
    imageUrl: "/data/asset/astroVisGUI/Planets/Uranus.png",
  },
  {
    name:"Venus",
    imageUrl: "/data/asset/astroVisGUI/Planets/Venus.png"
  }
]


const focus = ref("Earth")

const moveToUpload = function (){

  window.location.href = '/dataManagement.html'

}

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


const instructionComplete = localStorage.getItem("instructionComplete")
const instructionShow = ref(instructionComplete===undefined || instructionComplete===null?true:false)




</script>

<style scoped>

.floating-toolbar {
  position: fixed;
  bottom: 20px;
  left: 20px;
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







