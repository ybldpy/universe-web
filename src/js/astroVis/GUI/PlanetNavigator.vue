
<template>

<div class="wrapper">

  <template v-for="(planet,index) in planets" >
    <div class="icon image-container" :style="computePosition(focus,index)" @click="onClick(planet.name)" >
      <div class="text-overlay">{{planet.name}}</div>
      <img :src="planet.imageUrl" alt="Description"/>
    </div>
  </template>

</div>


</template>



<script setup>



const parameters=defineProps({
  planets:Array,
  focus:String
})


const emit = defineEmits(['planetSelect'])

const onClick = function (name){
  emit("planetSelect",name)
}





const computePosition = function(focusName,index){

  const radius = 400


  const focusIndex = parameters.planets.findIndex((v,i)=>v.name === focusName)
  const windowWidth = window.innerWidth;
  const angle = (index - focusIndex) * 50; // 调整角度
  const x = windowWidth/2 + radius * Math.sin(angle);
  const y = radius * (Math.cos(angle) - 0.8);

  return {
    left: `${x}px`,
    bottom: `${y}px`,
    opacity:  `${1 - Math.abs(angle)/150}`
  }


}





</script>


<style scoped>
.wrapper {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
}

.space-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="black"/><g fill="white"><circle cx="25" cy="25" r="0.5"/><circle cx="75" cy="35" r="0.3"/><circle cx="100" cy="80" r="0.4"/><circle cx="150" cy="50" r="0.2"/><circle cx="200" cy="120" r="0.3"/><circle cx="250" cy="75" r="0.4"/><circle cx="300" cy="30" r="0.2"/><circle cx="350" cy="100" r="0.3"/><circle cx="375" cy="150" r="0.4"/><circle cx="325" cy="200" r="0.3"/><circle cx="275" cy="250" r="0.2"/><circle cx="225" cy="300" r="0.4"/><circle cx="175" cy="350" r="0.3"/><circle cx="125" cy="375" r="0.2"/><circle cx="75" cy="325" r="0.4"/><circle cx="25" cy="275" r="0.3"/><circle cx="50" cy="225" r="0.2"/><circle cx="100" cy="175" r="0.4"/><circle cx="150" cy="125" r="0.3"/><circle cx="200" cy="75" r="0.2"/><circle cx="250" cy="25" r="0.4"/><circle cx="300" cy="50" r="0.3"/><circle cx="350" cy="125" r="0.2"/><circle cx="375" cy="175" r="0.4"/><circle cx="325" cy="225" r="0.3"/><circle cx="275" cy="275" r="0.2"/><circle cx="225" cy="325" r="0.4"/><circle cx="175" cy="375" r="0.3"/><circle cx="125" cy="325" r="0.2"/><circle cx="75" cy="275" r="0.4"/><circle cx="25" cy="225" r="0.3"/><circle cx="50" cy="175" r="0.2"/><circle cx="100" cy="125" r="0.4"/><circle cx="150" cy="75" r="0.3"/><circle cx="200" cy="25" r="0.2"/><circle cx="250" cy="50" r="0.4"/><circle cx="300" cy="125" r="0.3"/><circle cx="350" cy="175" r="0.2"/><circle cx="375" cy="225" r="0.4"/><circle cx="325" cy="275" r="0.3"/><circle cx="275" cy="325" r="0.2"/><circle cx="225" cy="375" r="0.4"/><circle cx="175" cy="325" r="0.3"/><circle cx="125" cy="275" r="0.2"/><circle cx="75" cy="225" r="0.4"/><circle cx="25" cy="175" r="0.3"/><circle cx="50" cy="125" r="0.2"/><circle cx="100" cy="75" r="0.4"/><circle cx="150" cy="25" r="0.3"/><circle cx="200" cy="50" r="0.2"/><circle cx="250" cy="125" r="0.4"/><circle cx="300" cy="175" r="0.3"/><circle cx="350" cy="225" r="0.2"/><circle cx="375" cy="275" r="0.4"/><circle cx="325" cy="325" r="0.3"/><circle cx="275" cy="375" r="0.2"/><circle cx="225" cy="325" r="0.4"/><circle cx="175" cy="275" r="0.3"/><circle cx="125" cy="225" r="0.2"/><circle cx="75" cy="175" r="0.4"/><circle cx="25" cy="125" r="0.3"/><circle cx="50" cy="75" r="0.2"/><circle cx="100" cy="25" r="0.4"/><circle cx="150" cy="50" r="0.3"/><circle cx="200" cy="125" r="0.2"/><circle cx="250" cy="175" r="0.4"/><circle cx="300" cy="225" r="0.3"/><circle cx="350" cy="275" r="0.2"/><circle cx="375" cy="325" r="0.4"/><circle cx="325" cy="375" r="0.3"/><circle cx="275" cy="325" r="0.2"/><circle cx="225" cy="275" r="0.4"/><circle cx="175" cy="225" r="0.3"/><circle cx="125" cy="175" r="0.2"/><circle cx="75" cy="125" r="0.4"/><circle cx="25" cy="75" r="0.3"/><circle cx="50" cy="25" r="0.2"/><circle cx="100" cy="50" r="0.4"/><circle cx="150" cy="125" r="0.3"/><circle cx="200" cy="175" r="0.2"/><circle cx="250" cy="225" r="0.4"/><circle cx="300" cy="275" r="0.3"/><circle cx="350" cy="325" r="0.2"/><circle cx="375" cy="375" r="0.4"/><circle cx="325" cy="325" r="0.3"/><circle cx="275" cy="275" r="0.2"/><circle cx="225" cy="225" r="0.4"/><circle cx="175" cy="175" r="0.3"/><circle cx="125" cy="125" r="0.2"/><circle cx="75" cy="75" r="0.4"/><circle cx="25" cy="25" r="0.3"/><circle cx="50" cy="75" r="0.2"/><circle cx="100" cy="125" r="0.4"/><circle cx="150" cy="175" r="0.3"/><circle cx="200" cy="225" r="0.2"/><circle cx="250" cy="275" r="0.4"/><circle cx="300" cy="325" r="0.3"/><circle cx="350" cy="375" r="0.2"/></g></svg>');
  background-size: cover;
  z-index: -1;
}

.info-content {
  position: fixed;
  top:0;
  left:0;
  display: none;
}

.icon {
  margin: 0 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: absolute;
  opacity: 0.5;
  transform: translateY(0);
}
.icon.active {
  background-color: rgba(0, 150, 255, 0.7);
  transform: scale(1.1) translateY(-5px);
  opacity: 1;
  z-index: 10;
}

.image-container {
  width: 50px;
  height: 50px;
  border-radius: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  background-size: cover;
  align-items: center;
  background: linear-gradient(135deg, #ffffff, #cccccc);
  box-shadow: 10px 10px 5px grey; /* Box shadow */
  margin: 5px;
  padding: 5px;
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
  text-align: center;
  background-color: transparent;
  color: white;
  opacity: 1;
  padding: 1px;
  border-radius: 5px;
}



</style>