<script setup lang="ts">
import { ref, computed, toRef, onMounted } from 'vue';
import { ElSelect, ElOption, ElButton } from 'element-plus';
import { getPluginApi } from '../requset/api/plugin';

const fatherElement = defineProps({
    selectedValues:{   
        type: Array as () => string[],
        required: true,
    },
 })

const selectedValues = toRef(fatherElement.selectedValues);

const options=ref([] as Array<{ label: string; value: string;code:string }> | undefined);

onMounted(async () => {
    options.value=await getOptions()
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
    let res=await getPluginApi();
    if (res) {
        return res.data.map((plugin) => ({ label: plugin.name?plugin.name:'no name', value:plugin.id,code:plugin.code }));
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
        selectedValues.value=[''];
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

defineExpose({selectedValues})

</script>

<template>
    <div>
      <el-row>
        <el-button v-if="selectedValues?selectedValues.length===0:true" @click="addSelect">+</el-button>
      </el-row>
      <el-row v-for="(item, index) in selectedValues" :key="index">
        <el-select v-model="selectedValues[index]" placeholder="Select" @change="handleChange(index)">
          <el-option
            v-for="option in options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
            :disabled="disabledOptions.includes(option.value)"
          ><span class="mr-1">{{ option.label }}</span><el-tag>{{option.code}}</el-tag></el-option>
        </el-select>
        <el-button @click="removeSelect(index)">-</el-button>
        <el-button v-if="index ===0" @click="addSelect">+</el-button>
      </el-row>
      
    </div>
</template>
  

  
  