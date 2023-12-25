<template >
    <el-select v-bind="$attrs" v-on="$emit" placeholder="backends" multiple class="flex-grow">
        <el-option v-for="option in options" v-bind="option">
            <span class="mr-1">
                {{ option.label }}
            </span>
            <el-tag v-if="option.tag">{{ option.tag }}</el-tag>
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { useOptions } from '../hooks';
const props = defineProps<{
    modelValue: string[];
}>();
const emits = defineEmits(['update:modelValue']);
const { options, update } = useOptions('plugin');
update();
</script>