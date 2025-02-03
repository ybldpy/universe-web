

<template>




    <div class="common-layout">
      <el-container>
        <el-aside>
          <el-menu  default-active="/"
                    text-color="#fff"
                    active-text-color="#ffd04b"
                    background-color="#545c64"
                    router>


            <el-menu-item index="/">
              <el-icon><Management /></el-icon>Uploaded Data Management
            </el-menu-item>

            <el-menu-item index="/upload">
              <el-icon><Upload /></el-icon>Data upload
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <RouterView/>
        </el-main>
      </el-container>
    </div>




</template>

<script lang="ts" setup>
// import {
//   Document,
//   Menu as IconMenu,
//   Location,
//   Setting,
// } from '@element-plus/icons-vue'
import {Upload,Management} from "@element-plus/icons-vue";

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped>
.el-menu{
  height: 100vh
}





</style>