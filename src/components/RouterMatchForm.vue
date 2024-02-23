<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref, watch } from 'vue';
import { Plus, Minus, Close, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
const modelValue = defineModel<Model.SgHttpRouteMatch>({
    default: {
        path: null,
        header: null,
        query: null,
        method: null,
    },
})
const DEFAULT_HEADER_MATCH = <Model.SgHttpHeaderMatch>{
    kind: "exact" as const,
    name: "" as const,
    value: "" as const
}
const DEFAULT_QUERY_MATCH = <Model.SgHttpQueryMatch>{
    kind: "exact" as const,
    value: {
        key: "",
        value: "",
    }
}
const newHeaderItem = ref(<Model.SgHttpHeaderMatch>{
    ...DEFAULT_HEADER_MATCH
})
const newQueryItem = ref(<Model.SgHttpQueryMatch>{
    ...DEFAULT_QUERY_MATCH
})
const SG_HTTP_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'HEAD',
    'OPTIONS',
    'PATCH',
    'TRACE',
    'CONNECT',
] as const;
const enable = ref({
    path: computed({
        get() {
            return modelValue.value.path !== null
        },
        set(v) {
            if (v) {
                modelValue.value.path = {
                    kind: "Prefix",
                    value: "/"
                }
            } else {
                modelValue.value.path = null
            }
        }
    }),
    header: computed({
        get() {
            return modelValue.value.header !== null
        },
        set(v) {
            if (v) {
                modelValue.value.header = []
            } else {
                modelValue.value.header = null
            }
        }
    }),
    query: computed({
        get() {
            return modelValue.value.query !== null
        },
        set(v) {
            if (v) {
                modelValue.value.query = []
            } else {
                modelValue.value.query = null
            }
        }
    }),
    method: computed({
        get() {
            return modelValue.value.method !== null
        },
        set(v) {
            if (v) {
                modelValue.value.method = []
            } else {
                modelValue.value.method = null
            }
        }
    }),
})

const addHeaderItem = () => {
    if (modelValue.value.header !== null) {
        modelValue.value.header.push(newHeaderItem.value)
        newHeaderItem.value = {
            ...DEFAULT_HEADER_MATCH
        }
    }
}
const addQueryItem = () => {
    if (modelValue.value.query !== null) {
        modelValue.value.query.push(newQueryItem.value)
        newQueryItem.value = {
            ...DEFAULT_QUERY_MATCH
        }
    }
}
const removeHeaderItem = (idx: number) => {
    if (modelValue.value.header !== null) {
        modelValue.value.header.splice(idx, 1)
    }
}
const removeQueryItem = (idx: number) => {
    if (modelValue.value.query !== null) {
        modelValue.value.query.splice(idx, 1)
    }
}
</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item label="options">
            <el-checkbox v-model="enable.path">{{ 'Match Path' }}</el-checkbox>
            <el-checkbox v-model="enable.header">{{ 'Match Header' }}</el-checkbox>
            <el-checkbox v-model="enable.query">{{ 'Match Query' }}</el-checkbox>
            <el-checkbox v-model="enable.method">{{ 'Match Method' }}</el-checkbox>
        </el-form-item>
        <el-form-item label="path" v-if="modelValue.path !== null">
            <el-input v-model="modelValue.path.value">
                <template #prepend>
                    <el-select v-model="modelValue.path.kind" style="width: 115px">
                        <el-option label="exact" value="Exact" />
                        <el-option label="prefix" value="Prefix" />
                        <el-option label="regular expression" value="Regular" />
                    </el-select>
                </template>
            </el-input>
        </el-form-item>
        <el-form-item label="header" v-if="modelValue.header !== null">
            <el-col class="pr-2 space-y-1">
                <el-row v-for="headerMatch, idx  in modelValue.header" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-select v-model="headerMatch.kind" class="w-64">
                        <el-option label="exact" value="exact" />
                        <el-option label="regular" value="regular" />
                    </el-select>
                    <el-input v-model="headerMatch.name"></el-input>
                    <span>:</span>
                    <el-input v-if="headerMatch.kind === 'exact'" v-model="headerMatch.value"></el-input>
                    <el-input v-if="headerMatch.kind === 'regular'" v-model="headerMatch.re"></el-input>
                    <el-button :icon="Minus" @click="() => removeHeaderItem(idx)"></el-button>
                </el-row>
                <el-row class="flex justify-end items-center flex-nowrap space-x-2">
                    <el-button :icon="Plus" @click="addHeaderItem" type="primary"></el-button>
                </el-row>
            </el-col>
        </el-form-item>
        <el-form-item label="query" v-if="modelValue.query !== null">
            <el-col class="pr-2 space-y-1">
                <el-row v-for="queryMatch, idx  in modelValue.query" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-select v-model="queryMatch.kind" class="w-64">
                        <el-option label="exact" value="exact" />
                        <el-option label="regular" value="regular" />
                    </el-select>
                    <el-input v-model="queryMatch.value.key"></el-input>
                    <span>=</span>
                    <el-input v-if="queryMatch.kind === 'exact'" v-model="queryMatch.value.value"></el-input>
                    <el-input v-if="queryMatch.kind === 'regular'" v-model="queryMatch.value.re"></el-input>
                    <el-button :icon="Minus" @click="() => removeQueryItem(idx)"></el-button>
                </el-row>
                <el-row class="flex justify-end items-center flex-nowrap space-x-2">
                    <el-button :icon="Plus" @click="addQueryItem" type="primary"></el-button>
                </el-row>
            </el-col>
        </el-form-item>
        <el-form-item label="method" v-if="modelValue.method !== null">
            <el-select v-model="modelValue.method" multiple placeholder="Http Methods" class="flex-grow">
                <el-option v-for="M in SG_HTTP_METHODS" :key="M" :label="M" :value="M" />
            </el-select>
        </el-form-item>
    </el-form>
</template>