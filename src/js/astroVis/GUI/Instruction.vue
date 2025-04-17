

<template>

  <div id="instruction-shadow-layer">
  </div>


    <div class="instruct-container" id="instruct-text">
      <!------------------------------------------------------------------------->
      <!--0/4-->

      <div id="instructionContent">


          <div id="slide-cutter">
            <div class="welcome-container" v-if="curInstructionIdx===0" @animationend="nextInstruction(0)">
              <div class="welcome-logo">
                <img src="/data/logo.png" style="width: 100%;height: 100%;"/>
              </div>
              <div class="welcome-text">
                <span style="color:#31ACBC; font-family: gilroy-light; font-size: 1.5em;">WELCOME TO </span>
                <span style="color: black; font-family: gilroy-extrabold; font-size: 1.5em;">THE DIGITAL UNIVERSE</span>
              </div>
            </div>
          </div>


        <!--1/4-->
        <div :style="{opacity: curInstructionIdx===1?1:0}" class="single-instruction-container">
          <div class="instruct-img-container" id="instruct-gues-1">
            <img src="/data/asset/astroVisGUI/instructions/Animation/left-click.png">
            <img src="/data/asset/astroVisGUI/instructions/Animation/move.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(1)">
            >> Next
          </div>

          <div class="instruct-text-container" id="instruction1">
          <span >Press the left mouse button</span> <br>
          keep it held down <br>
          <span >and move the mouse freely to adjust the perspective.</span>
        </div>
        </div>

        <!--2/4-->
        <div :style="{opacity: curInstructionIdx===2?1:0}" class="single-instruction-container">
          <div class="instruct-img-container" id="instruct-gues-2">
            <img src="/data/asset/astroVisGUI/instructions/Animation/left-click.png">
            <img src="/data/asset/astroVisGUI/instructions/Animation/ctrl.png">
            <img src="/data/asset/astroVisGUI/instructions/Animation/move.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(2)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction2">
            <span>Press the left button and the control key</span> <br>
            keep them held down <br>
            <span>and move the mouse freely to pan the view.</span>
          </div>
        </div>

        <!--3/4-->

        <div :style="{opacity: curInstructionIdx===3?1:0}" class="single-instruction-container">
          <div class="instruct-img-container" id="instruct-gues-3">
            <img src="/data/asset/astroVisGUI/instructions/Animation/right-click.png">
            <img src="/data/asset/astroVisGUI/instructions/Animation/up-and-down.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(3)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction3">
            <span>Press and hold the right mouse button</span> <br>
            then slide the mouse forward to move closer to the target <br>
            <span>or backward to move further away.</span>
          </div>
        </div>


        <!--4/4-->
        <div :style="{opacity: curInstructionIdx == 4?1:0}" class="single-instruction-container">
          <div class="instruct-img-container" id="instruct-gues-4">
            <img src="/data/asset/astroVisGUI/instructions/Animation/zoom-in.png">
          </div>
          <div class="next-btn-container" @click="nextInstruction(4)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction4">
            <span>The closer you get to the focused target, <br>
                the more detailed surface information <br>
                will be presented.</span>
          </div>
        </div>




        <!--1/4-->

        <div class="single-instruction-container" :style="{opacity: curInstructionIdx===5?1:0}">
          <div class="instruct-img-container" id="instruct-gues-5">
            <img src="/data/asset/astroVisGUI/Icons/hide.png">
          </div>
          <div class="next-btn-container" @click="nextInstruction(5)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction5">
            <span style="color:aqua">Press <div class="key-icon">c</div>
            to hide/display the UI</span>
          </div>
        </div>

        <!--2/4-->


        <div class="single-instruction-container" :style="{opacity: curInstructionIdx==6?1:0}">
          <div class="instruct-img-container" id="instruct-gues-6">
            <img src="/data/asset/astroVisGUI/Icons/upload.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(6)">
            >> Next
          </div>

          <div class="instruct-text-container" id="instruction6">
            <span style="color:aqua">Press <div class="key-icon">U</div>
            to upload dataset</span>
          </div>
        </div>


        <!--3/4-->
        <div class="single-instruction-container" :style="{opacity: curInstructionIdx==7?1:0}">
          <div class="instruct-img-container" id="instruct-gues-7">
            <img src="/data/asset/astroVisGUI/Icons/information.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(7)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction7">
            <span style="color:aqua">Press <div class="key-icon">i</div>
            to hide/display information</span>
          </div>
        </div>

        <!--4/4-->

        <div class="single-instruction-container" :style="{opacity: curInstructionIdx == 8?1:0}">
          <div class="instruct-img-container" id="instruct-gues-8">
            <img src="/data/asset/astroVisGUI/Icons/setting.png">
          </div>

          <div class="next-btn-container" @click="nextInstruction(8)">
            >> Next
          </div>
          <div class="instruct-text-container" id="instruction8">
            <span style="color:aqua">Press <div class="key-icon">G</div>
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


const nextInstruction = (notifyIndex)=>{


  if (notifyIndex<curInstructionIdx.value){return;}
  if (curInstructionIdx.value>=8){emit("instructionComplete");return}
  curInstructionIdx.value++;
  setTimeout(()=>{
    nextInstruction(notifyIndex+1)
  },7*1000)
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
}


#instructionContent{
  position: absolute;
  width: 78%;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}


#nextBtn{
  position: absolute;
  font-weight: bolder;
  font-family: gilory-light;
  background-color: #4CAF50;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  font-size: 1.7em;
  opacity: 1;
  z-index: 101;

  cursor: pointer;
  transition: background-color 0.3s ease;
}

#nextBtn:hover {
  background-color: #45a045; /* hover 时更深的绿色 */
}


.welcome-logo {
  height: 100%;
  border-radius: 100%; /* 圆形图片 */
  overflow: hidden; /* 隐藏超出圆形部分 */
  object-fit: cover;
}




.instruct-container {
  position: fixed;
  width: 100%;
  height: 25%;
  background: #31ACBC;
  display: flex;
  top: 50%;
  transform: translateY(-50%);

  color: #333;
  font-weight: bold;
  z-index: 100
}


.welcome-text {
  width: 70%;
  height: 100%;
  font-weight: bold;
  color: #333;
  margin-left: 2.5%;
  align-content: center;


}


.welcome-container {
  position: absolute;
  height: 100%;
  width: 100%;
  font-size: xx-large;
  display: flex;
  stroke: aqua;
  stroke-width: 10px;
  background-color: white;

  animation: slide 20s linear forwards;
}


#slide-cutter{
  position: absolute;
  height: 100%;
  width: 100%;
}





.instruct-text-container {
  font-size: 24px;
  width: 100%;
  height: 95%;
  align-content: center;
  text-align: center;
  position: absolute;
  stroke-width: 10px;
  color: #31ACBC;

}

.instruct-img-container {
  position: absolute;
  width: auto;
  left: 50%;
  height: auto;
  transform: translateX(-50%);
  top: -8rem;
  display: flex;
  justify-content: center; /* 让所有图片在水平方向上整体居中 */
  align-items: center;     /* 如果你希望图片也在垂直方向对齐 */
  gap: 1rem;               /* 图片之间的间距，可根据需要调整 */
}


#nextBtnContainer {
  position: absolute;   /* 需要相对于有 position 的父元素 */
  right: 0%;
  width: 10%;
  top: 50%;
  transform: translateY(-50%);
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;


}




.single-instruction-container{
  position: absolute;
  transition: opacity 2s ease-in-out;
  height: 100%;
  width: 100%;
  background-color: white;

}

.check-circle {
  position: absolute;
  top: 10px;
  width: 60px;
  height: 60px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.check-circle::after {
  position: absolute;
  content: "✓";
  color: #4CAF50;
  font-size: 40px;
  align-content: center;
}


.skip-text {
  position: absolute;
  top: 80px;
  color: white;
  font-size: 42px;
  font-weight: bold;
  text-transform: uppercase;
  align-content: center;
}

.key-icon {
  display: inline-block; /* Changed to inline-block */
  width: 1.5em; /* Reduced size to fit better inline */
  height: 1.5em;
  border-radius: 5px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  text-align: center;
  align-items: center;
  align-content: center;
  line-height: 30px; /* Vertical centering */
  font-family: Arial, sans-serif;
  font-size: 22px; /* Match text size */
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 2px; /* Add some spacing around the key */
}

.next-btn-container {
  right: 2.5%;
  font-size: 1.8em;
  justify-content: right;
  font-weight: bolder;
  font-family: gilory-light;
  display: flex;
  background: none;
  color: #31ACBC;
  opacity: 1;
  z-index: 100;
  position: absolute;
}


.next-btn-container:hover {
    /* Change background on hover */
  transform: scale(1.1); /* Slightly enlarge the div */
  cursor: pointer;
}


@keyframes slide {
  0% {
    transform: translateX(-70%);
    opacity: 1;
  }
  100% {
    transform: translateX(200%); /* Move beyond the left edge and loop back */
    opacity: 1;
  }
}



@font-face {
  font-family: 'gilroy-light';
  src: url('/data/Fonts/gilroy-light.otf') format('opentype');
}

@font-face {
  font-family: 'gilroy-extrabold';
  src: url('data/Fonts/gilroy-extrabold.otf') format('opentype');
}



</style>