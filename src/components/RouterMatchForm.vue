<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref } from 'vue';
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
    value: "" as const
}
const DEFAULT_QUERY_MATCH = <Model.SgHttpQueryMatch>{
    kind: "exact" as const,
    value: "" as const
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

const collapse = ref({
    header: true,
    query: true,
})
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


</script>

<template>
    <el-form label-width="auto" label-suffix=":">
        <el-form-item>
            <template #label>
                <div class="flex justify-between items-center flex-nowrap">
                    <div class="space-x-2">
                        <span>path</span>
                        <el-switch v-model="enable.path" active-text="规则" inactive-text="所有" inline-prompt></el-switch>
                    </div>
                </div>
            </template>
            <el-input v-if="enable.path && modelValue.path !== null" v-model="modelValue.path.value">
                <template #prepend>
                    <el-select v-model="modelValue.path.kind" style="width: 115px">
                        <el-option label="exact" value="Exact" />
                        <el-option label="prefix" value="Prefix" />
                        <el-option label="regular expression" value="Regular" />
                    </el-select>
                </template>
            </el-input>
        </el-form-item>
        <el-form-item label="header">
            <div class="flex justify-between items-center flex-nowrap">
                <div class="space-x-2">
                    <el-switch v-model="enable.header" active-text="规则" inactive-text="所有" inline-prompt></el-switch>
                </div>
                <el-button v-if="enable.header" :icon="collapse.header ? ArrowDown : ArrowRight"
                    @click="() => { collapse.header = !collapse.header }" text circle size="large"></el-button>
            </div>
            <el-col v-if="collapse.header && modelValue.header !== null" class="pr-2">
                <el-row v-for="headerMatch, idx  in modelValue.header" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-input v-model="headerMatch.value">
                        <template #prepend>
                            <el-select v-model="headerMatch.kind" style="width: 115px">
                                <el-option label="exact" value="exact" />
                                <el-option label="regular" value="regular" />
                            </el-select>
                        </template>
                    </el-input>
                    <el-button :icon="Minus" @click="() => removeHeaderItem(idx)"></el-button>
                </el-row>
                <el-divider border-style="dashed" content-position="left">添加新规则</el-divider>
                <el-row class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-input v-model="newHeaderItem.value">
                        <template #prepend>
                            <el-select v-model="newHeaderItem.kind" style="width: 115px">
                                <el-option label="exact" value="exact" />
                                <el-option label="regular" value="regular" />
                            </el-select>
                        </template>
                    </el-input>
                    <el-button :icon="Plus" @click="addHeaderItem" type="primary"></el-button>
                </el-row>
            </el-col>
        </el-form-item>
        <el-form-item>
            <template #label>
                <div class="flex justify-between items-center flex-nowrap">
                    <div class="space-x-2">
                        <span>query</span>
                        <el-switch v-model="enable.query" active-text="规则" inactive-text="所有" inline-prompt></el-switch>
                    </div>
                    <el-button v-if="enable.query" :icon="collapse.query ? ArrowDown : ArrowRight"
                        @click="() => { collapse.query = !collapse.query }" text circle size="large"></el-button>
                </div>
            </template>
            <el-col v-if="collapse.query && modelValue.query !== null" class="pr-2">
                <el-row v-for="queryMatch, idx  in modelValue.query" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-input v-model="queryMatch.value">
                        <template #prepend>
                            <el-select v-model="queryMatch.kind" style="width: 115px">
                                <el-option label="exact" value="exact" />
                                <el-option label="regular" value="regular" />
                            </el-select>
                        </template>
                    </el-input>
                    <el-button :icon="Minus" @click="() => removeQueryItem(idx)"></el-button>
                </el-row>
                <el-divider border-style="dashed" content-position="left">添加新规则</el-divider>
                <el-row class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-input v-model="newQueryItem.value">
                        <template #prepend>
                            <el-select v-model="newQueryItem.kind" style="width: 115px">
                                <el-option label="exact" value="exact" />
                                <el-option label="regular" value="regular" />
                            </el-select>
                        </template>
                    </el-input>
                    <el-button :icon="Plus" @click="addQueryItem" type="primary"></el-button>
                </el-row>
            </el-col>
        </el-form-item>
        <el-form-item>
            <template #label>
                <div class="flex justify-between items-center flex-nowrap">
                    <div class="space-x-2">
                        <span>method</span>
                        <el-switch v-model="enable.method" active-text="规则" inactive-text="所有" inline-prompt></el-switch>
                    </div>
                </div>
            </template>
            <el-select v-if="enable.method && modelValue.method !== null" v-model="modelValue.method" multiple
                placeholder="Http Methods" class="flex-grow">
                <el-option v-for="M in SG_HTTP_METHODS" :key="M" :label="M" :value="M" />
            </el-select>
        </el-form-item>
    </el-form>
</template>