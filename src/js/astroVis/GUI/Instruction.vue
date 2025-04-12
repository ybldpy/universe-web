

<template>

  <div id="instruction-shadow-layer">


    <div class="instruct-container" id="instruct-text">
      <!------------------------------------------------------------------------->
      <!--0/4-->

      <div class="welcome-text-container" v-if="curInstructionIdx===0" @animationend="nextInstruction">
        <span style="color:aqua">Welcome to</span> the Digital Universe
      </div>

      <!--1/4-->
      <div :style="{opacity: curInstructionIdx===1?1:0}" class="single-instruction-container">
        <div class="instruct-img-container" id="instruct-gues-1" >
          <img src="/data/asset/astroVisGUI/instructions/Animation/left-click.png">
          <img src="/data/asset/astroVisGUI/instructions/Animation/move.png">
        </div>

        <div class="instruct-text-container" id="instruction1">
          <span style="color:aqua">Press the left mouse button</span> <br>
          keep it held down <br>
          <span style="color:brown">and move the mouse freely to adjust the perspective.</span>
        </div>
      </div>

      <!--2/4-->
      <div :style="{opacity: curInstructionIdx===2?1:0}" class="single-instruction-container">
        <div class="instruct-img-container" id="instruct-gues-2">
          <img src="/data/asset/astroVisGUI/instructions/Animation/left-click.png">
          <img src="/data/asset/astroVisGUI/instructions/Animation/ctrl.png">
          <img src="/data/asset/astroVisGUI/instructions/Animation/move.png">
        </div>
        <div class="instruct-text-container" id="instruction2">
          <span style="color:aqua">Press the left button and the control key</span> <br>
          keep them held down <br>
          <span style="color:brown">and move the mouse freely to pan the view.</span>
        </div>
      </div>

      <!--3/4-->

      <div :style="{opacity: curInstructionIdx===3?1:0}" class="single-instruction-container">
        <div class="instruct-img-container" id="instruct-gues-3">
          <img src="/data/asset/astroVisGUI/instructions/Animation/right-click.png">
          <img src="/data/asset/astroVisGUI/instructions/Animation/up-and-down.png">
        </div>
        <div class="instruct-text-container" id="instruction3">
          <span style="color:aqua">Press and hold the right mouse button</span> <br>
          then slide the mouse forward to move closer to the target <br>
          <span style="color:brown">or backward to move further away.</span>
        </div>
      </div>


      <!--4/4-->
      <div :style="{opacity: curInstructionIdx == 4?1:0}" class="single-instruction-container">
        <div class="instruct-img-container" id="instruct-gues-4">
          <img src="/data/asset/astroVisGUI/instructions/Animation/zoom-in.png">
        </div>
        <div class="instruct-text-container" id="instruction4">
            <span style="color:aqua">The closer you get to the focused target, <br>
                the more detailed surface information <br>
                will be presented.</span>
        </div>
      </div>




      <!--1/4-->

      <div class="single-instruction-container" :style="{opacity: curInstructionIdx===5?1:0}">
        <div class="instruct-img-container" id="instruct-gues-5">
          <img src="/data/asset/astroVisGUI/Icons/hide.png">
        </div>
        <div class="instruct-text-container" id="instruction5">
            <span style="color:aqua">Press "c"/"C" <br>
            to hide/display the UI</span>
        </div>
      </div>

      <!--2/4-->


      <div class="single-instruction-container" :style="{opacity: curInstructionIdx==6?1:0}">
        <div class="instruct-img-container" id="instruct-gues-6">
          <img src="/data/asset/astroVisGUI/Icons/upload.png">
        </div>
        <div class="instruct-text-container" id="instruction6">
            <span style="color:aqua">Press "u"/"U" <br>
            to upload dataset</span>
        </div>
      </div>


      <!--3/4-->
      <div class="single-instruction-container" :style="{opacity: curInstructionIdx==7?1:0}">
        <div class="instruct-img-container" id="instruct-gues-7">
          <img src="/data/asset/astroVisGUI/Icons/upload.png">
        </div>
        <div class="instruct-text-container" id="instruction7">
            <span style="color:aqua">Press "i"/"I" <br>
            to hide/display information</span>
        </div>
      </div>

      <!--4/4-->

      <div class="single-instruction-container" :style="{opacity: curInstructionIdx == 8?1:0}">
        <div class="instruct-img-container" id="instruct-gues-8">
          <img src="/data/asset/astroVisGUI/Icons/setting.png">
        </div>
        <div class="instruct-text-container" id="instruction8">
            <span style="color:aqua">Press "g"/"G" <br>
            to open/close the SCENE.</span>
        </div>
      </div>

    </div>

  </div>

</template>



<script setup>

import {ref,onMounted} from "vue"



const emit = defineEmits(['instructionComplete'])


const curInstructionIdx = ref(0)


const nextInstruction = ()=>{
  if (curInstructionIdx.value>8){emit("instructionComplete");return}
  curInstructionIdx.value++;
  setTimeout(nextInstruction,8*1000)
}


</script>




<style scoped>


#instruction-shadow-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100; /* 要在页面最上层 */
  pointer-events: all; /* 可以拦截点击 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.instruct-container {
  position: fixed;
  width: 100%;
  height: 150px;
  background: rgba(6, 246, 246, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 24px;
  font-weight: bold;
  overflow: visible;

}


.welcome-text-container {
  position: absolute;
  white-space: nowrap;
  height: 150px;
  width: 30%;
  font-size: xx-large;
  align-content: center;
  text-align: center;
  stroke: aqua;
  stroke-width: 10px;
  background-color: white;
  transform: translateX(-100%);
  animation: slide 6s linear forwards;
}

.instruct-text-container {
  position: absolute;
  white-space: nowrap;
  height: 150px;
  width: 50%;
  font-size: xx-large;
  align-content: center;
  text-align: center;
  background-color: white;
  stroke-width: 10px;
  background-color: white;
}

.instruct-img-container {
  position: absolute;
  top: -120px;
}




.single-instruction-container{
  transition: opacity 2s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;

}


@keyframes slide {
  0% {
    transform: translateX(-50%);
    opacity: 1;
  }
  100% {
    transform: translateX(400%); /* Move beyond the left edge and loop back */
    opacity: 1;
  }
}

</style>