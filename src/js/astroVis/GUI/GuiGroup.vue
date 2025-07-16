<template>
  <div class="gui-group">
    <template v-for="(value, key) in model">
      <template v-if="key!=='selectable'">
        <!-- Boolean 类型：开关 -->
        <el-form-item v-if="typeof value === 'boolean'" :label="key.charAt(0).toUpperCase() + key.slice(1)" class="gui-item" @click.stop="">
          <el-switch v-model="model[key]" style="--el-switch-on-color: #31ACBC"/>
        </el-form-item>

        <!-- 数字类型：滑块 -->
        <el-form-item v-else-if="typeof value === 'number'" :label="key.charAt(0).toUpperCase() + key.slice(1)" class="gui-item" @click.stop="">
          <el-input-number v-model="model[key]" :min="0" :max="100" :step="0.1" style="width: 90%;padding-left: 2%" />
        </el-form-item>

        <template v-else-if="isVec3(value)">
          <el-collapse class="gui-collapse" @click.stop="">
            <el-collapse-item :name="key" :title="key.charAt(0).toUpperCase() + key.slice(1)">
              <el-form-item label="x">
                <el-input-number model-value="value.x"></el-input-number>
              </el-form-item>
              <el-form-item label="y">
                <el-input-number model-value="value.y"></el-input-number>
              </el-form-item>
              <el-form-item label="z">
                <el-input-number model-value="value.z"></el-input-number>
              </el-form-item>
            </el-collapse-item>
          </el-collapse>
        </template>


        <el-form-item v-else-if="isOptionMap(value)" :label="key.charAt(0).toUpperCase() + key.slice(1)">

          <el-select v-model="model[key].selected">
            <el-option v-for="(val,label) in model[key].optionMap" :label="label.charAt(0).toUpperCase() + label.slice(1)" :value="val" :key="label"/>
          </el-select>

        </el-form-item>

        <!-- 对象嵌套：折叠继续递归 -->
        <el-form-item v-else-if="isNested(value) && value !== null" class="gui-item nested-group" @click.stop="">
          <el-collapse class="gui-collapse">
            <el-collapse-item :name="key" :title="key.charAt(0).toUpperCase() + key.slice(1)">
              <GuiGroup :model="model[key]" />
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </template>
    </template>
  </div>
</template>

<script setup>
defineProps({
  model: Object
})

function isNested(val){
  return Object.prototype.toString.call(val) === '[object Object]'
}

function isOptionMap(val) {
  return val && val.isOption && val.optionMap && typeof val.optionMap === 'object'
}

function isVec3(val){
  return val && val.isVector3 === true;
}

function isColor(val) {
  return typeof val === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)
}
</script>

<style scoped>
.gui-group {
  width: 100%;
}
.gui-item {
  margin-bottom: 12px;
}
.nested-group {
  padding-left: 16px;
  border-left: 2px solid #eee;
  margin-left: 4px;
}
.gui-collapse ::v-deep(.el-collapse-item__header) {
  font-weight: bold;
  background: #f9f9f9;
}
.gui-collapse ::v-deep(.el-collapse-item__wrap) {
  background: #fafafa;
  padding-left: 8px;
}
</style>

