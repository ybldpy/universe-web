<script setup>
const emit = defineEmits(['settingClick', 'infoClick', 'uploadClick', 'hideClick'])

function handleClick(action) {
  emit(action)
}
</script>

<template>
  <div id="bottom-menu-container">
    <div class="icon-image-container" @click="emit('settingClick')">
      <img src="/data/asset/astroVisGUI/Icons/setting.png" alt="Settings">
    </div>

    <div class="icon-image-container" @click="emit('infoClick')">
      <img src="/data/asset/astroVisGUI/Icons/information.png" alt="Info">
    </div>

    <div class="icon-image-container" @click="emit('uploadClick')">
      <img src="/data/asset/astroVisGUI/Icons/upload.png" alt="Upload">
    </div>

    <div class="icon-image-container" @click="emit('hideClick')">
      <img src="/data/asset/astroVisGUI/Icons/hide.png" alt="Hide">
    </div>
  </div>
</template>

<style scoped>
#bottom-menu-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  z-index: 90;
}

.icon-image-container {
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.icon-image-container:hover {
  transform: scale(1.2);
}

.icon-image-container img {
  width: 32px;
  height: 32px;
}
</style>