<script setup lang="ts">
import { ref, computed, toRef, onMounted } from 'vue';
import { ElSelect, ElOption, ElButton } from 'element-plus';
import { getPluginApi } from '../requset/api/plugin';
import { getBackendApi } from '../requset/api/backend';
import { isSgPlugin } from '../types/plugin';
const fatherElement = defineProps({
  selectedValues: {
    type: Array as () => string[],
    required: true,
  },
  // type can be `plugin` `backend`
  apiType: {
    type: String,
    default: 'plugin',
  }
})

const selectedValues = toRef(fatherElement.selectedValues);

const options = ref([] as Array<{ label: string; value: string; tag?: string | null }> | undefined);

onMounted(async () => {
  options.value = await getOptions()
})

const disabledOptions = computed(() => {
  const disabledValues: string[] = [];
  for (const value of selectedValues.value) {
    if (selectedValues.value.filter((v) => v === value).length > 1) {
      disabledValues.push(value);
    }
  }
  return disabledValues;
});

const getOptions = async () => {
  let res = fatherElement.apiType === 'plugin' ? await getPluginApi() : await getBackendApi();
  if (res) {
    return res.data.map((obj) => {
      if (isSgPlugin(obj)) { return { label: obj.name ? obj.name : 'no name', value: obj.id, tag: obj.code } }
      else {
        return { label: obj.name_or_host, value: obj.id, tag: obj.namespace }
      }
    });
  }
  throw new Error('获取插件列表失败');
};

const removeSelect = (index: number) => {
  selectedValues.value.splice(index, 1);
};

const addSelect = () => {
  if (selectedValues.value) {
    selectedValues.value.push('');
  }
  else {
    selectedValues.value = [''];
  }

};

const handleChange = (index: number) => {
  const selected = selectedValues.value[index];
  for (let i = 0; i < selectedValues.value.length; i++) {
    if (i !== index && selectedValues.value[i] === selected) {
      selectedValues.value[i] = '';
    }
  }
};

defineExpose({ selectedValues })

</script>

<template>
  <div>
    <el-row>
      <el-button v-if="selectedValues ? selectedValues.length === 0 : true" @click="addSelect">+</el-button>
    </el-row>
    <el-row v-for="(_item, index) in selectedValues" :key="index">
      <el-select v-model="selectedValues[index]" placeholder="Select" @change="handleChange(index)">
        <el-option v-for="option in options" :key="option.value" :label="option.label" :value="option.value"
          :disabled="disabledOptions.includes(option.value)"><span class="mr-1">{{ option.label }}</span><el-tag
            v-if="option.tag">{{ option.tag }}</el-tag></el-option>
      </el-select>
      <el-button @click="removeSelect(index)">-</el-button>
      <el-button v-if="index === 0" @click="addSelect">+</el-button>
    </el-row>

  </div>
</template>
  

  
  