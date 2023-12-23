<template >
    <el-row>
        <el-form-item :label="$props.title ?? 'backend'" class="flex flex-grow">
            <el-select v-model="$props.modelValue" placeholder="backends" multiple class="flex-grow">
                <el-option v-for="option in options" v-bind="option">
                    <span class="mr-1">
                        {{ option.label }}
                    </span>
                    <el-tag v-if="option.tag">{{ option.tag }}</el-tag>
                </el-option>
            </el-select>
        </el-form-item>
    </el-row>
</template>

<script setup lang="ts">
import { useOptions } from '../hooks';
defineProps<{
    modelValue: string[];
    title?: string
}>();
const { options, update } = useOptions('backend');
update();
</script>