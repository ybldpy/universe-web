<template>

  <div v-show="uiShow">


    <ScenePanel :nodesProps="sceneNodesUi" :node-identifiers="nodeIdentifiers" class="gui-panel" v-model:focus-node="focusNodeName" v-model:visible="scenePanelVisible"></ScenePanel>

    <Instruction @instruction-complete="onInstructionComplete" v-if="instructionShow"></Instruction>
    <PlanetNavigator :planets="planets" :focus="focusNodeName" @planet-select="select => {focusNodeName = select}"></PlanetNavigator>
    <ToolBar @hide-click="uiShow = !uiShow" @upload-click="moveToUpload" @setting-click="scenePanelVisible = !scenePanelVisible" @info-click="infoShow = !infoShow"></ToolBar>
    <el-card
        v-show="infoShow"
        shadow="hover"
        class = 'info-card'
    >

      <template v-slot:header>
        {{focusNodeName}}
      </template>
      <template v-slot:default>
        <el-scrollbar height="400">
          <div class="info-text" >
            {{ infoText }}
          </div>
        </el-scrollbar>
      </template>
    </el-card>

  </div>




</template>

<script setup lang="ts">
import {computed, reactive, ref, watch} from 'vue'
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

// const nodeIdentifiers = computed(()=>{
//
//   const identifiers = [];
//   sceneNodesUi.forEach(node => {
//
//     if (node.selectable){
//       for (const key in node) {
//         if (node.hasOwnProperty(key) && key!=='selectable') {
//           identifiers.push(key);
//         }
//       }
//     }
//   });
//
//   return identifiers;
//
// })

watch(focusNodeName, (newVal, oldVal) => {
  if (newVal === oldVal) {
    return;
  }
  parameters.uiManager.flyTo(newVal.toLowerCase())

})



const infoShow = ref(false)
const infoText = computed(()=>{
  const focusNodeNameLower = focusNodeName.value.toLowerCase();
  let index =  planets.findIndex(p=>p.name.toLowerCase()===focusNodeNameLower);
  if(index<0){
    index = planets.findIndex(p=>p.name.toLowerCase() === 'other');
  }
  return planets[index].infoText
});


const uiShow = ref(true)
document.onkeydown = (e) => {
  if (e.key==='c' || e.key === 'C'){
    uiShow.value = !uiShow.value
  }else if (e.key.toLowerCase() === 'u'){
    moveToUpload();
  }else if (e.key.toLowerCase() === 'g'){
    scenePanelVisible.value = !scenePanelVisible.value;
  }else if (e.key.toLowerCase() === 'i'){
    infoShow.value = !infoShow.value;
  }



}



const planets = [
  {
    name:"Sun",
    imageUrl: "/data/asset/astroVisGUI/Planets/Sun.png",
    infoText: "The Sun is the star at the center of our solar system. It is a nearly perfect sphere of hot plasma, with a diameter of about 1.39 million kilometers. The Sun is primarily composed of hydrogen (73%) and helium (25%), with trace amounts of other elements. It generates energy through nuclear fusion in its core, where hydrogen atoms combine to form helium, releasing a tremendous amount of energy in the process. This energy radiates outward, providing light and heat to Earth and the other planets. The Sun's surface temperature is about 5,500 degrees Celsius, while its core reaches temperatures of around 15 million degrees Celsius. The Sun has a complex magnetic field that drives solar phenomena such as sunspots, solar flares, and coronal mass ejections. These events can impact space weather and have effects on Earth's climate and technology. The Sun is approximately 4.6 billion years old and is expected to continue shining for another 5 billion years."
  },
  {
    name: "Mercury",
    imageUrl: "/data/asset/astroVisGUI/Planets/Mercury.png",
    infoText: "Mercury is the smallest planet in the solar system and the closest to the Sun. It has no moons and a highly eccentric orbit, taking 88 days to complete one revolution around the Sun. Mercury's surface is heavily cratered and resembles the Moon, with extreme temperature variations due to its thin atmosphere, known as an exosphere. Daytime temperatures can reach up to 430°C (800°F), while nighttime temperatures can drop to -180°C (-290°F). The planet has a large metallic core, making it the second densest planet after Earth. Mercury's lack of a significant atmosphere means it has no weather or wind, and its surface is exposed to intense solar radiation."
  },
  {
    name:"Venus",
    imageUrl: "/data/asset/astroVisGUI/Planets/Venus.png",
    infoText: "Venus is the second planet from the Sun in our solar system. It is named after the Roman goddess of love and beauty. Venus is often called Earth's \"sister planet\" because they are similar in size and mass. However, Venus has a thick atmosphere composed mainly of carbon dioxide, with clouds of sulfuric acid, which creates a strong greenhouse effect and makes it the hottest planet in our solar system, with surface temperatures reaching over 460°C (860°F). Its surface is rocky and features volcanoes, mountains, and extensive lava plains. Venus rotates in a retrograde direction, taking 243 Earth days to complete one rotation, which is longer than its orbital period around the Sun of 225 Earth days."
  },
  {
    name:"Earth",
    imageUrl: "/data/asset/astroVisGUI/Planets/Earth.png",
    infoText: "Earth is the third planet from the Sun and the only known celestial body to support life. It formed around 4.5 billion years ago. The Earth's surface is about 71% water, with the remainder consisting of continents and islands. The planet has a diverse range of climates and ecosystems, from polar regions to tropical rainforests. Earth's atmosphere, composed mainly of nitrogen and oxygen, supports a vast array of life forms. Human activities have significantly impacted the planet, leading to environmental challenges such as climate change and biodiversity loss. Efforts are ongoing to address these issues and ensure a sustainable future for all life on Earth."
  },
  {
    name: "Mars",
    imageUrl: "/data/asset/astroVisGUI/Planets/Mars.png",
    infoText: "Mars is the fourth planet from the Sun and the second-smallest planet in the solar system. It is often referred to as the \"Red Planet\" due to its reddish appearance, which is caused by iron oxide (rust) on its surface. Mars has a thin atmosphere composed mainly of carbon dioxide, with traces of nitrogen and argon. The planet's surface features a mix of mountains, valleys, and plains, including the largest volcano in the solar system, Olympus Mons, and the Valles Marineris canyon system. Mars has two small moons, Phobos and Deimos. The presence of water ice and evidence of ancient riverbeds suggest that liquid water once flowed on the planet's surface, making it a prime target in the search for past or present life. Numerous missions, including rovers like Curiosity and Perseverance, have explored Mars to study its geology, climate, and potential habitability."
  },
  {
    name: "Jupiter",
    imageUrl: "/data/asset/astroVisGUI/Planets/Jupiter.png",
    infoText: "Jupiter is the largest planet in our solar system, a gas giant primarily composed of hydrogen and helium. It has a diameter of about 142,984 kilometers and is more than twice as massive as all the other planets combined. Located fifth from the Sun, Jupiter has a short rotation period of about 10 hours, causing it to appear slightly flattened. The planet is known for its dynamic atmosphere, featuring the Great Red Spot, a massive storm that has existed for centuries. Jupiter has at least 95 moons, with the four largest—Io, Europa, Ganymede, and Callisto—being of significant scientific interest. Europa, in particular, is believed to have a subsurface ocean that could potentially support life. Additionally, Jupiter has a faint ring system made of dust particles. The planet's strong magnetic field and complex weather systems make it a key subject for studying planetary science and astrobiology."
  },
  {
    name:"Saturn",
    imageUrl: "/data/asset/astroVisGUI/Planets/Saturn.png",
    infoText: "Saturn is the sixth planet from the Sun and the second-largest planet in our solar system. It is a gas giant, primarily composed of hydrogen and helium. The planet is famous for its extensive ring system, which is made up of countless small particles of ice and rock. Saturn has at least 146 known moons, with Titan being the largest and most well-known. Titan has a thick atmosphere and liquid methane lakes on its surface. Saturn's atmosphere is characterized by its pale yellow color and banded appearance, similar to Jupiter. The planet's strong winds and storms create dynamic weather patterns. Saturn's rings and moons continue to be a subject of scientific study, offering insights into the formation and evolution of the solar system."
  },
  {
    name:"Uranus",
    imageUrl: "/data/asset/astroVisGUI/Planets/Uranus.png",
    infoText: "Uranus is an ice giant, the seventh planet from the Sun, known for its distinctive blue-green hue caused by methane in its atmosphere. Unique among planets, Uranus rotates on an axis tilted nearly 98 degrees, giving it extreme seasons with each pole experiencing 42 years of sunlight followed by 42 years of darkness. Discovered in 1781 by William Herschel, it is the first planet found using a telescope. Uranus has 27 moons (named after literary characters) and faint, dark rings. Its composition includes a rocky core, icy mantle, and atmosphere of hydrogen, helium, and methane. Despite being less massive than Neptune, it is larger in. diameter Notably, it is the coldest planet (-224°C) and has an off-center, tilted magnetic field. Its weather features high-speed winds (up to 560 mph), though less active than gas giants. Uranus remains a subject of intrigue for its unusual dynamics and composition."
  },

  {
    name:"Neptune",
    imageUrl: "/data/asset/astroVisGUI/Planets/Neptune.png",
    infoText: "Neptune is the eighth and farthest planet from the Sun in our solar system. It is an ice giant, similar in composition to Uranus, with a thick atmosphere composed mainly of hydrogen, helium, and methane. The presence of methane gives Neptune its deep blue color. The planet has no solid surface, with its atmosphere transitioning into a slushy mixture of ices and rock. Neptune is known for its extreme weather, including the fastest winds in the solar system, which can reach speeds of over 2,000 kilometers per hour. It has a system of six rings made of dust and debris. Neptune has 14 known moons, the largest of which is Triton, believed to be a captured Kuiper Belt object. Discovered in 1846, Neptune was first observed by Johann Galle based on mathematical predictions. Most of what we know about Neptune comes from the Voyager 2 flyby in 1989."
  },
  {
    name:"Pluto",
    imageUrl: "/data/asset/astroVisGUI/Planets/Pluto.png",
    infoText: "Pluto is a dwarf planet located in the Kuiper Belt, a region beyond Neptune. It was discovered in 1930 by Clyde Tombaugh and was considered the ninth planet until 2006 when it was reclassified as a dwarf planet by the International Astronomical Union. Pluto has a diameter of about 2,377 kilometers and orbits the Sun in an elliptical path that sometimes brings it closer to the Sun than Neptune. It has five known moons, with its largest moon, Charon, being nearly half its size. Pluto's surface is composed of a mix of nitrogen ice, methane ice, and water ice, and it has a thin atmosphere that expands and contracts as its distance from the Sun changes. The New Horizons spacecraft provided the first close-up images and data about Pluto in 2015, revealing a complex and geologically active world."
  },
  {
    name: "Other",
    imageUrl: "",
    infoText: "Other renderable object"
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
const instructionShow = ref(instructionComplete !== 'yes')
// const instructionShow = ref(true)

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


.info-card {
  position: fixed;
  top: 70px;
  left: 50px;
  font-family: gilory-light;

  width: min(300px, 25vw); /* 限制宽度适配响应式 */
  max-height: 70vh;
  z-index: 999;
  border-radius: 12px;
  transition: all 0.3s ease;

  background: #E3E3E3;
}

.info-text {
  font-size: 14px;
  font-weight: bolder;
  line-height: 1.6;
  color: #31ACBC;
}



</style>







