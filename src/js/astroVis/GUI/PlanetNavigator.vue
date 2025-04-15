
<template>

<div class="wrapper">

  <template v-for="(planet,index) in planets" >
    <div class="icon image-container" :style="computePosition(focus,index)" @click="onClick(planet.name)" >
      <div class="text-overlay">{{planet.name}}</div>
      <div class="icon-img">
        <img :src="planet.imageUrl" alt="Description"/>
      </div>
    </div>
  </template>

</div>


</template>



<script setup>

import {ref,onMounted} from 'vue'




const parameters=defineProps({
  planets:Array,
  focus:String
})


const emit = defineEmits(['planetSelect'])

const onClick = function (name){
  emit("planetSelect",name)
}


const windowWidth = ref(window.innerWidth);



const computePosition = function(focusName,index){

  const radius = 400


  let focusIndex = parameters.planets.findIndex((v,i)=>{
    if (v.name === undefined || v.name === null){return false;}
    return v.name.toLowerCase() === focusName.toLowerCase()
  })
  if (focusIndex === -1){
    focusIndex = parameters.planets.findIndex((v,i)=>v.name === 'Other')
  }
  const width = windowWidth.value;
  const angle = (index - focusIndex) * 50; // 调整角度
  const x = width/2 + radius * Math.sin(angle);
  const y = radius * (Math.cos(angle) - 0.8);


  return {
    left: `${x}px`,
    bottom: `${y}px`,
    opacity:  `${1 - Math.abs(angle)/150}`
  }


}


onMounted(()=>{
  window.addEventListener('resize',()=>{
    windowWidth.value = window.innerWidth;
  })
})






</script>


<style scoped>
.wrapper {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 80;
}


.icon-img {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100%;
  cursor: pointer;
  width: 100%;
  height: 100%;
  transition: all 0.1s ease;
  opacity: 1;
  background: linear-gradient(135deg, #ffffff, #cccccc);
  box-shadow: 5px 5px 5px grey; /* Box shadow */
}

.icon {
  margin: 0 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.5;
  transform: translateY(0);
  position: absolute;
}
.icon.active {
  background-color: rgba(0, 150, 255, 0.7);
  transform: scale(1.1) translateY(-5px);
  opacity: 1;
  z-index: 10;
}

.image-container {
  width: 60px;
  height: 60px;
  overflow: visible;
  display: flex;
  justify-content: center;
  background-size: cover;
  align-items: center;

}

.icon-image-container {
  position: fixed;
  width: 60px;
  scale: 100%;
  height: 60px;
  opacity: 0;
  border-radius: 20%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  background-size: cover;
  align-items: center;
  align-content: center;
}

.text-overlay {
  position: absolute;
  top: -1.5em;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-style: inherit;

  text-align: center;
  background-color: transparent;
  color: white;
  opacity: 1;
  -webkit-text-stroke: 1px #fbf9f9;
  -webkit-text-stroke-width: 1px;
}



</style>