<template>

  <el-table :data="fileList"  style="width: 100%" v-loading="fileListLoading">
    <el-table-column label="Dataset name" prop="fileName">
    </el-table-column>
    <el-table-column label = "Category" >
      <template #default="{row,col,$index}">
        {{categoryMap[row.category]}}
      </template>
    </el-table-column>
    <el-table-column label="Status">
      <template #default="{row,col,$index}">
        {{statusMap[row.status]}}
<!--        {{$index}}-->
      </template>
    </el-table-column>
    <el-table-column>
      <template #default="{row,col,$index}">
        <el-icon v-if="row.status!==2" class="hover-icon" @click="deleteFile(row,$index)"><delete></delete></el-icon>
      </template>
    </el-table-column>

  </el-table>





</template>

<script setup>
import {reactive,ref} from "vue";
import {get,post} from '../../js/utils/networkUtil'
import {BACKEND_API,JUMP_ADDRESS} from "../../js/api";
import {isUnAuthed} from "../../js/utils/authUtil";
import {Delete, Refresh} from "@element-plus/icons-vue";

const fileList = reactive([

])
const fileListLoading = ref(true);


const categoryMap = {
  0:"Catalog",
  1:"Layer"
}
const statusMap = {
  3:"ready",
  0:"Failed",
  1:"Failed",
  2: "Processing",
  '-1': "Failed",
}


function deleteFile(row,index){
  fileList.splice(index,1);
  get(BACKEND_API.FILE_DELETE,{fileId:row.fileId});
}

async function fetchFileList(url){
  const result = await get(BACKEND_API.FILE_QUERYALL);
  fileListLoading.value = false;

  if (!result.requestSuccess && result.error===null && isUnAuthed(result.response)){
    window.location.href = JUMP_ADDRESS.LOG_IN;
    return;
  }
  if (!result.requestSuccess){return;}

  if (result.response.data.code!==200){return;}


  const files = result.response.data.data.data;
  for (let i = 0;i<files.length;i+=1){
    const file = {
      fileId: files[i]["fileid"],
      fileName: files[i]["filename"],
      category: files[i]["category"],
      status: files[i]['filestatus'],
      parameters:files[i]['parameters']
    }
    fileList.push(file);
  }
}




fetchFileList(BACKEND_API.FILE_QUERYALL);



</script>


<style scoped>
.button-container {
  display: flex;
  justify-content: space-between; /* 左右两边对齐 */
  align-items: center; /* 垂直居中对齐 */
}

.right-buttons {
  display: flex;
  gap: 10px; /* 按钮之间的间距 */
}


.hover-icon {
  cursor: pointer; /* 鼠标悬停时变成手型 */
  transition: color 0.3s, transform 0.3s; /* 平滑过渡效果 */
  color: #606266; /* 默认颜色 */
}

.hover-icon:hover {
  color: #f56c6c; /* 悬停时的颜色（红色） */
  transform: scale(1.2); /* 悬停时放大 1.2 倍 */
}
</style>