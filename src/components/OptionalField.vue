<script setup lang="ts" generic="T">
import { UnwrapRef, computed, ref } from 'vue';

const modelValue = defineModel<T | null>({
    default: null,
})
const props = defineProps<{
    default: T
}>()
const cachedValue = ref<T>(props.default)
const enabled = computed({
    set(v: boolean) {
        if (v) {
            modelValue.value = cachedValue.value as T
        } else {
            cachedValue.value = modelValue.value as UnwrapRef<T>
            modelValue.value = null
        }
    },
    get() {
        return modelValue.value !== null
    }
})
</script>

<template>
    <div class="flex space-x-2">
        <el-switch v-model="enabled" inline-prompt></el-switch>
        <slot name="none" v-if="modelValue === null"></slot>
        <slot name="some" v-if="modelValue !== null"></slot>
    </div>
</template>