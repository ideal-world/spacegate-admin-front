<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
const modelValue = defineModel<Model.SgHttpHeaderMatch>({
    default: {
        kind: "exact",
        value: ""
    },
})
</script>

<template>
    <el-input v-model="modelValue.value">
        <template #prepend>
            <el-select v-model="modelValue.kind" style="width: 115px">
                <el-option label="exact" value="exact" />
                <el-option label="regular" value="regular" />
            </el-select>
        </template>
    </el-input>
</template>