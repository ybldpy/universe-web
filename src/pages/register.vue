<template>
  <div class="login-container">

    <div class="form-title">Register</div>

    <el-form :model="formData" label-width="auto" class="login-form" ref="loginFormRef" :rules="formValidationRules">



      <el-form-item label="Username" prop="username" :show-message="true" :label-position="labelPosition">
        <el-input v-model="formData.username"/>
      </el-form-item>

      <el-form-item label="Password" prop="password" :label-position="labelPosition" :show-message="true">
        <el-input v-model='formData.password'></el-input>
      </el-form-item>

      <el-form-item>
        <el-button v-if="!logging" type="primary" @click="onSubmit" style="width: 100%;">Sign in
        </el-button>
        <el-button v-else type="primary" style="width: 100%;" loading>
          Sign in
        </el-button>

      </el-form-item>

      <div class="form-footer">
        <a href="#" @click.prevent="onSignUp">Sign up</a>
      </div>

    </el-form>

  </div>
</template>


<script setup>




</script>


<style scoped>



</style>