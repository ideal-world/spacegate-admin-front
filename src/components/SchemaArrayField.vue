<script setup lang="ts">
const modelValue = defineModel<string[]>({
  required: true,
})

const addItem = () => {
  modelValue.value = [...modelValue.value, '']
}

const removeItem = (index: number) => {
  modelValue.value = modelValue.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="schema-array-field">
    <div v-for="(_, index) in modelValue" :key="index" class="schema-array-field__row">
      <el-input v-model="modelValue[index]" />
      <el-button type="danger" text @click="removeItem(index)">删除</el-button>
    </div>
    <el-button type="primary" plain size="small" @click="addItem">添加</el-button>
  </div>
</template>

<style scoped>
.schema-array-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schema-array-field__row {
  display: flex;
  gap: 8px;
}
</style>
