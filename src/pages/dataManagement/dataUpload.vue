<template>



  <el-dialog v-model="uploadFormDialogShow" :before-close="(callback)=>{if(!fileUploadFormSubmitting.value){callback()}}" :close-on-click-modal="false"  title="Data Upload" center>

    <el-form :model="uploadForm" label-width="auto" ref="fileUploadFormRef" :rules="uploadFormValidationRules">

      <el-form-item prop="datasetName" label="Dataset Name">
        <el-input v-model="uploadForm.datasetName"/>
      </el-form-item>
      <el-form-item prop="type" label="Data Type" >
        <el-radio-group v-model="uploadForm.type" >
          <el-radio :value="uploadDataType.starCatalog">Star Catalog</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="uploadForm.type===uploadDataType.starCatalog" label="Attribute mapping">
        <el-row :gutter="2" style="width: 100%">
          <el-col :span="8">
            <el-select v-model="catalogAttributeMapping.bv" :clearable="true" placeholder="bv" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.lum" placeholder="lumanity" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.absMag" placeholder="absolute magnitude" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
        </el-row>
        <el-row :gutter="2" style="width:100%">
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.vx" placeholder="x velocity" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.vy" placeholder="y velocity" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.vz" placeholder="z velocity" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
        </el-row>
        <el-row style="width: 100%;">
          <el-col :span="8">
            <el-select :clearable="true" v-model="catalogAttributeMapping.speed" placeholder="speed" @change="onCatalogAttributeMappingSelect">
              <el-option  v-for="option in catalogAttributeMappingOption" :value="option.value" :disabled="option.selected"></el-option>
            </el-select>
          </el-col>
        </el-row>


      </el-form-item>


      <el-form-item v-if="uploadForm.type===uploadDataType.surface" label="Area">
        <el-row :gutter="24">
          <el-col :span="11">
            <el-input placeholder="north" v-model="uploadForm.parameters.north" @input="(value)=>{uploadForm.parameters.north = limitNonNumericalValue(value)}"></el-input>
          </el-col>
          <el-col :span="11">
            <el-input placeholder="east" v-model="uploadForm.parameters.east" @input="(value)=>{uploadForm.parameters.east = limitNonNumericalValue(value)}"></el-input>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="11">
            <el-input placeholder="south" v-model="uploadForm.parameters.south" @input="(value)=>{uploadForm.parameters.south = limitNonNumericalValue(value)}"></el-input>
          </el-col>
          <el-col :span="11">
            <el-input placeholder="west" v-model="uploadForm.parameters.west" @input="(value)=>{uploadForm.parameters.west = limitNonNumericalValue(value)}"></el-input>
          </el-col>
        </el-row>
      </el-form-item>

      <el-form-item>
        <el-upload ref="fileUploadCompRef" :auto-upload="false" @change="(rawFile,list)=>{onFileSelect(rawFile,list)}" :on-remove="(uploadFile, uploadFiles)=>{resetFileSelection();resetCatalogAttributeMapping();}">
          <el-button>Select File</el-button>
        </el-upload>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" style="width: 100%" @click="(e)=>{fileUploadFormSubmitting = true;submitUploadForm()}" v-if="!fileUploadFormSubmitting">Upload</el-button>
        <el-button type="primary" style="width: 100%" v-else loading>Upload</el-button>
      </el-form-item>

    </el-form>



  </el-dialog>

  <div class="button-container">
    <el-button type="primary" @click="uploadFormDialogShow = true">
      Upload File <el-icon class="el-icon--right"><Upload /></el-icon>
    </el-button>
    <div class="right-buttons">
      <el-button type="primary" >All Start</el-button>
      <el-button type="danger">All Pause</el-button>
    </div>
  </div>

  <el-table :data="uploadList" style="width: 100%" >
    <template #empty>No file being uploaded</template>
    <el-table-column type="selection"  />
    <el-table-column prop="datasetName" label="File">
    </el-table-column>
    <el-table-column label="Progress" >
      <template #default="{row,col,index}">
        <el-progress :percentage="row.progress" v-if="row.status===STATUS_UPLOAD_TASK.UPLOADING || row.status === STATUS_UPLOAD_TASK.PAUSE"/>
        <div v-else-if="row.status===STATUS_UPLOAD_TASK.COMPLETED">Completed</div>
        <div v-else>Failed</div>
      </template>
    </el-table-column>

    <el-table-column header-align="center" align="center">
      <template #default="{row,col,$index}">
        <div v-if="row.status === STATUS_UPLOAD_TASK.UPLOADING || row.status === STATUS_UPLOAD_TASK.PAUSE || row.status === STATUS_UPLOAD_TASK.CANCEL">
          <el-button v-if="row.status==STATUS_UPLOAD_TASK.UPLOADING" type="danger" @click="onPause(row)">
            Pause
          </el-button>
          <el-button v-else type="primary" @click="onResume(row)">Resume</el-button>
          <el-button @click="onCancelTask(row)" v-if="row.status !== STATUS_UPLOAD_TASK.CANCEL">
            Cancel
          </el-button>
          <el-button v-else loading>Cancel</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>


</template>

<script setup>
import {Upload} from '@element-plus/icons-vue'
import {reactive} from "vue";
import {ref} from "vue";
import {post,get} from "../../js/utils/networkUtil";
import {isUnAuthed} from "../../js/utils/authUtil";
import {JUMP_ADDRESS,BACKEND_API} from "../../js/api";
import {ElMessage} from "element-plus";
import Papa from 'papaparse';




const catalogAttributeMapping = reactive(
    {
      "bv":null,
      "lum":null,
      "absMag":null,
      "vx":null,
      "vy":null,
      "vz":null,
      "speed":null
    }
);







const resetFileSelection = ()=>{
  selectedFile = null;
  fileUploadCompRef.value.clearFiles();
}

const updateAttributeMapping = (file)=>{


  catalogAttributeMappingOption.length = 0;
  Papa.parse(file,{
    workder:true,
    header:false,
    step: function(results,parser){
      const headers = results.data;
      for(let i = 0;i<headers.length;i++){
        catalogAttributeMappingOption.push({
          value:headers[i],
          selected:false
        })
      }
      parser.abort();
    }
  })
}



const fileUploadRef = ref(null);


const onFileSelect = (file,files)=>{


  if (selectedFile!=null){
    resetCatalogAttributeMapping();
    files.splice(0,1);
  }
  selectedFile = file;

  updateAttributeMapping(getSelectedFile());
}


const catalogAttributeMappingOption=reactive([

])


const onCatalogAttributeMappingSelect = (value)=>{

  catalogAttributeMappingOption.forEach((v)=>{
    const keyList = Object.keys(catalogAttributeMapping)
    for(let i = 0;i<keyList.length;i++){
      if (catalogAttributeMapping[keyList[i]] === v.value){
        v.selected = true;
        return;
      }
    }
    v.selected = false;


  });

}



const fileUploadFormRef = ref(null);
const fileUploadCompRef = ref(null)
let fileUploadFormSubmitting = ref(false);
let selectedFile = null

const limitNonNumericalValue = function (v,v1){
  v= v.replace(/[^0-9.]/g,'')
  if (v === ""){
    return null;
  }
  return parseFloat(v);
}

const uploadDataType = {
  starCatalog:0,
  surface:1
}


const uploadFormDialogShow = ref(false);
const uploadForm = reactive({
  type:-1,
  datasetName:"",
  parameters:{
    coverage:{
      north:null,
      west:null,
      east:null,
      south:null,
    },
    catalogAttributeMapping:catalogAttributeMapping
  }
})



const resetCatalogAttributeMapping = function (){

  const keys = Object.keys(catalogAttributeMapping);
  for(let i = 0;i<keys.length;i++){
    uploadForm.parameters.catalogAttributeMapping[keys[i]] = null;
  }

  catalogAttributeMappingOption.length = 0;

}
function resetUploadForm(){
  uploadForm.type = -1;
  uploadForm.datasetName = ""
  uploadForm.parameters.coverage.south = null
  uploadForm.parameters.coverage.north = null
  uploadForm.parameters.coverage.east = null
  uploadForm.parameters.coverage.west = null

  resetCatalogAttributeMapping();

}


function resetUploadFileDialogAndForm(){
  uploadFormDialogShow.value = false;
  resetUploadForm();
  resetFileSelection();
}

const cancelUploadTask = async function(fileId){
  const result = await get(BACKEND_API.FILE_UPLOAD_CANCEL,{fileId:fileId});
}


const uploadFormValidationRules = {
  type:[{type:"enum",enum:[0,1],required:true, message:"Must select one"}],
  datasetName:[{required:true}],
  selectedFile:[{validator(r,v,c){selectedFile === null?c(new Error()):c()}}]
}


let count = ref(50)
const hasUploadTasks = ref(false);
const STATUS_UPLOAD_TASK = {
  FAIL:0,
  UPLOADING:1,
  PAUSE:2,
  COMPLETED:3,
  CANCELLING:4
}
const a = ref(true)




const uploadList = reactive([])


async function onCancelTask(row){

  const previousStatus = row.status;
  row.status = STATUS_UPLOAD_TASK.CANCEL;
  //if (idx<0){return;}
  //const uploadTask = uploadList[idx];
  //uploadList.splice(idx,1);
  //uploadTask.status = STATUS_UPLOAD_TASK.FAIL;
  const result = await get(BACKEND_API.FILE_UPLOAD_CANCEL,{fileId:fileId});
  if(!result.requestSuccess || result.response.data.code!==200 || result.response.data.data.status!==1){
    row.status = previousStatus;
    if(previousStatus === STATUS_UPLOAD_TASK.UPLOADING){
      //resume uploading
      doUpload(row);
    }
  }
  else {
    let idx = -1;
    for(let i = 0;i<uploadList.length;i++){
      if (uploadList[i]===row){
        idx = i;
        break;
      }
    }
    if(idx<0){
      return;
    }
    uploadList.splice(idx,1);
  }



}
function onPause(uploadTask){
  uploadTask.status = STATUS_UPLOAD_TASK.PAUSE
}

function onResume(uploadTask){
  uploadTask.status = STATUS_UPLOAD_TASK.UPLOADING
  doUpload(uploadTask)
}




// return a raw file
const getSelectedFile = function (){
  if (selectedFile!=null){
    return selectedFile.raw
  }
  return null;
}



const doUpload = function (uploadTask,bunchSize = 4){
  const retryTimes = 4;
  let left = 0;
  let right = uploadTask.lastUploadChunkIndex;
  let chunkUploadStatus = []
  for(let i = 0;i<=uploadTask.lastUploadChunkIndex;i++){
    chunkUploadStatus.push(true);
  }
  for(let i = uploadTask.lastUploadChunkIndex+1;i<uploadTask.chunkNums;i++){
    chunkUploadStatus.push(false);
  }

  let successCallbackRef = null;
  let uploadFuncRef = null;
  let uploadCoordinatorRef = null;

  const successCallback = (fileChunkIndex)=>{
    chunkUploadStatus[fileChunkIndex] = true;
    uploadTask.lastUploadChunkIndex = Math.max(uploadTask.lastUploadChunkIndex,fileChunkIndex);
    uploadTask.uploadedChunkCount++;
    uploadTask.progress = Math.min(100,Math.ceil(uploadTask.uploadedChunkCount/uploadTask.chunkNums*100))
    if (uploadTask.uploadedChunkCount>=uploadTask.chunkNums){
      uploadTask.status = STATUS_UPLOAD_TASK.COMPLETED;
    }
    else {
      uploadCoordinatorRef()
    }

  }
  successCallbackRef = successCallback;
  const errorCallback= () =>{
    uploadTask.status = STATUS_UPLOAD_TASK.FAIL;
  }

  const uploadCoordinator = ()=>{
    if (right>=uploadTask.chunkNums-1||uploadTask.status!==STATUS_UPLOAD_TASK.UPLOADING){return;}
    for(let i = left;i<=right&&chunkUploadStatus[i];i++){
      left = i+1;
    }
    const uploadingCount = right-left+1;
    for(let i = 0;i<bunchSize-uploadingCount && right<uploadTask.chunkNums-1;i++,right++){
      uploadFuncRef(right+1,retryTimes);
    }
  }
  uploadCoordinatorRef = uploadCoordinator;

  const uploadFunc = async (fileChunkIndex,retryTimes)=>{
    const chunkUploadUrl = BACKEND_API.FILE_UPLOAD_CHUNK;
    const offset = fileChunkIndex*uploadTask.chunkSize
    const chunkBuffer = uploadTask.uploadFile.slice(offset,Math.min(offset+uploadTask.chunkSize,uploadTask.uploadFile.size))
    while(retryTimes>0){
      const result = await post(chunkUploadUrl,{
        fileId:uploadTask.fileId,
        chunkIndex:fileChunkIndex,
        isLastChunk: fileChunkIndex == uploadTask.chunkNums-1,
        chunk:chunkBuffer
      },{
        'Content-Type': 'multipart/form-data'
      })

      if (!result.requestSuccess || result.response.data.data.status!=1){
        retryTimes--;
      }
      else {
        successCallbackRef(fileChunkIndex);
        return;
      }
    }
    errorCallback();
  }
  uploadFuncRef = uploadFunc;
  uploadCoordinator()

}

const CHUNK_SIZE = 5*1024*1024

const startUpload = function (file,fileId,datasetName,chunkSize){


  const uploadTask = {
    uploadFile:file,
    datasetName:datasetName,
    fileId:fileId,
    chunkSize:chunkSize,
    chunkNums:Math.ceil(file.size/chunkSize),
    lastUploadChunkIndex:-1,
    uploadedChunkCount:0,
    progress:0,
    status:STATUS_UPLOAD_TASK.UPLOADING
  }
  uploadList.push(uploadTask)
  doUpload(uploadList[uploadList.length-1]);
}
const submitUploadForm = async function (){




  const datasetName = uploadForm.datasetName;
  let validationResult = false;
  const file = getSelectedFile();
  try {
    validationResult = await fileUploadFormRef.value.validate();
  }
  catch (e){
    validationResult = false;
    fileUploadFormSubmitting.value = false;
  }
  if (!validationResult){fileUploadFormSubmitting.value = false;return;}
  if (file === null){return;}


  const requestUrl = BACKEND_API.FILE_UPLOAD_CREATE;
  const result = await post(requestUrl,{
    datasetName:uploadForm.datasetName,
    type:uploadForm.type,
    parameters:uploadForm.parameters,
    originalFileName:file.name,
    chunkNums: Math.ceil(file.size/CHUNK_SIZE)
  })


  if (result.error === null && isUnAuthed(result.response)){
    window.location.href = JUMP_ADDRESS.LOG_IN;
    return
  }


  if (!result.requestSuccess){
    ElMessage({type:"error",message:result.error,showClose:true});
    fileUploadFormSubmitting.value = false;
    return
  }

  const response = result.response.data;
  if (response.data.status!==1){
    ElMessage({type:"error",message:response.data.msg,showClose:true});
  }
  else{
    startUpload(file,response.data.data,datasetName,CHUNK_SIZE);
  }
  fileUploadFormSubmitting.value = false;
  resetUploadFileDialogAndForm();

}


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
</style>