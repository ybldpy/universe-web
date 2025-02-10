<template>
  <div class="login-container">

    <div class="form-title">Sign in to AstroVis</div>

    <el-form :model="formData" label-width="auto" class="login-form" ref="loginFormRef" :rules="formValidationRules">



      <el-form-item label="Username" prop="username" :show-message="true" :label-position="labelPosition">
        <el-input v-model="formData.username"/>
      </el-form-item>

      <el-form-item label="Password" prop="password" :label-position="labelPosition" :show-message="true">
        <el-input type="password" v-model='formData.password'></el-input>
      </el-form-item>

      <el-form-item>
        <el-button v-if="!logging" type="primary" @click="onSubmit" style="width: 100%;">Sign in
        </el-button>
        <el-button v-else type="primary" style="width: 100%;" loading>
          Sign in
        </el-button>

      </el-form-item>

      <div class="form-footer">
        <a href="/register.html">Sign up</a>
      </div>

    </el-form>

  </div>
</template>

<script setup>
import { reactive,ref} from 'vue'
import {ElMessage} from "element-plus";

import axios from 'axios';
import {SERVER_ADDRESS} from "../js/commons/config";
import {tokenKey} from "../js/commons/constants";
import {BACKEND_API, JUMP_ADDRESS} from "../js/api";

const loginFormRef = ref(null)
const submitBtn = ref(null)


const labelPosition = "top"

const nonEmptyRule = {
  required:true
}




const formValidationRules =
  {
    username:[{...nonEmptyRule}],
    password:[{...nonEmptyRule}]
  }


const logInUrl = BACKEND_API.LOG_IN
const logging = ref(false)

// do not use same name with ref
const formData = reactive({
  username:'',
  password:''
})


const signIn = async function(logInFormData){
  try {
    logging.value = true
    const response = await axios.post(logInUrl,{
      username:logInFormData.username,
      password:logInFormData.password
    })

    if (response.status!==200){
      ElMessage.error(response.statusText)
    }
    else if (response.data.code!==200){
      ElMessage.error(response.data.msg)
    }
    else if (response.data.data.status!=1){
      ElMessage.warning(response.data.data.msg);
    }
    else {
      const token = response.data.data.token;
      localStorage.setItem(tokenKey,token);
      window.location.href = JUMP_ADDRESS.UNIVERSE;
    }
  }
  catch (error){
    ElMessage.error(error)
  }
  finally {
    logging.value = false
  }


}

const onSubmit = async function(){
  try {
    await loginFormRef.value.validate();
    signIn(formData)
  }
  catch (e){

  }
}




</script>

<style scoped>
/* 背景样式 */

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to bottom right, #f0f4f8, #d9e6f2);
}

/* 标题样式 */
.form-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333333;
}

/* 表单样式 */
.login-form {
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
.form-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
}
.form-footer a {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}
.form-footer a:hover {
  text-decoration: underline;
}
</style>


