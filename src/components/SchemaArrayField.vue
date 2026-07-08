<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const texts = computed(() => locale.value.startsWith('zh') ? {
  add: '添加',
  delete: '删除',
} : {
  add: 'Add',
  delete: 'Delete',
})

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
      <el-button type="danger" text @click="removeItem(index)">{{ texts.delete }}</el-button>
    </div>
    <el-button type="primary" plain size="small" @click="addItem">{{ texts.add }}</el-button>
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
