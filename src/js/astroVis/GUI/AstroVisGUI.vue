<template>

  <div v-show="uiShow">


    <ScenePanel :nodesProps="sceneNodesUi" :node-identifiers="nodeIdentifiers" class="gui-panel" v-model:focus-node="focusNodeName" v-model:visible="scenePanelVisible"></ScenePanel>

    <Instruction @instruction-complete="onInstructionComplete" v-if="instructionShow"></Instruction>
    <PlanetNavigator :planets="planets" :focus="focusNodeName" @planet-select="select => {focusNodeName = select}"></PlanetNavigator>
    <ToolBar @hide-click="uiShow = !uiShow" @upload-click="moveToUpload" @setting-click="scenePanelVisible = !scenePanelVisible"></ToolBar>

  </div>




</template>

<script setup lang="ts">
import {reactive, ref, watch} from 'vue'
import ScenePanel from "./ScenePanel.vue";
import type {UIManager} from "./GuiManager";
import {
  InfoFilled,
  SwitchFilled,
  Top,
  View,
} from '@element-plus/icons-vue'
import Instruction from "./Instruction.vue";
import PlanetNavigator from "./PlanetNavigator.vue";
import ToolBar from "./ToolBar.vue";



const scenePanelVisible = ref(false)
const parameters = defineProps<{
  uiManager: UIManager
}>()




const sceneNodesUi = parameters.uiManager.getSceneNodesUi()
const focusNodeName = ref(parameters.uiManager.getFocusNodeName())
const nodeIdentifiers = parameters.uiManager.getNodeIdentifiers()
watch(focusNodeName, (newVal, oldVal) => {
  console.log(newVal)
  if (newVal === oldVal) {
    return;
  }
  parameters.uiManager.flyTo(newVal.toLowerCase())
})



const uiShow = ref(true)
document.onkeydown = (e) => {
  if (e.key==='c' || e.key === 'C'){
    uiShow.value = !uiShow.value
  }else if (true){

  }




}



const planets = [
  {
    name:"Sun",
    imageUrl: "/data/asset/astroVisGUI/Planets/Sun.png",
  },
  {
    name:"Earth",
    imageUrl: "/data/asset/astroVisGUI/Planets/Earth.png",
  },
  {
    name: "Jupiter",
    imageUrl: "/data/asset/astroVisGUI/Planets/Jupiter.png",
  },
  {
    name: "Mars",
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
  },
  {
    name: "Other",
    imageUrl: ""
  }
]


const focus = ref("Earth")


const onInstructionComplete = () => {
  localStorage.setItem('instructionComplete','yes');
  instructionShow.value = false;
}

const moveToUpload = function (){

  window.location.href = '/dataManagement.html'

}

console.log(localStorage.getItem('instructionComplete'))

const instructionComplete = localStorage.getItem("instructionComplete")
const instructionShow = ref(instructionComplete!=='yes')


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







