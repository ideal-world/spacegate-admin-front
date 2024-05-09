<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref, watch } from 'vue';
import { Plus, Minus, Close, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import OptionalField from './OptionalField.vue'
const { t } = useI18n();
function notEmpty<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined
}
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
            return notEmpty(modelValue.value.path)
        },
        set(v) {
            if (v) {
                modelValue.value.path = {
                    kind: "Prefix",
                    value: "/",
                    replace: null,
                }
            } else {
                modelValue.value.path = null
            }
        }
    }),
    header: computed({
        get() {
            return notEmpty(modelValue.value.header)
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
            return notEmpty(modelValue.value.query)
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
            return notEmpty(modelValue.value.method)
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
    if (notEmpty(modelValue.value.header)) {
        modelValue.value.header.push(newHeaderItem.value)
        newHeaderItem.value = {
            ...DEFAULT_HEADER_MATCH
        }
    }
}
const addQueryItem = () => {
    if (notEmpty(modelValue.value.query)) {
        modelValue.value.query.push(newQueryItem.value)
        newQueryItem.value = {
            ...DEFAULT_QUERY_MATCH
        }
    }
}
const removeHeaderItem = (idx: number) => {
    if (notEmpty(modelValue.value.header)) {
        modelValue.value.header.splice(idx, 1)
    }
}
const removeQueryItem = (idx: number) => {
    if (notEmpty(modelValue.value.query)) {
        modelValue.value.query.splice(idx, 1)
    }
}
</script>

<template>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item :label="t('label.option')">
            <el-checkbox v-model="enable.path">{{ t('label.matchPath') }}</el-checkbox>
            <el-checkbox v-model="enable.header">{{ t('label.matchHeader') }}</el-checkbox>
            <el-checkbox v-model="enable.query">{{ t('label.matchQuery') }}</el-checkbox>
            <el-checkbox v-model="enable.method">{{ t('label.matchMethod') }}</el-checkbox>
        </el-form-item>
        <el-form-item :label="t('label.path')" v-if="modelValue.path">
            <div class="flex flex-row flex-grow items-center flex-nowrap pr-2">
                <el-input v-model="modelValue.path.value">
                    <template #prepend>
                        <el-select v-model="modelValue.path.kind" class="w-28">
                            <el-option :label="t('label.exact')" value="Exact" />
                            <el-option :label="t('label.prefix')" value="Prefix" />
                            <el-option :label="t('label.regExp')" value="RegExp" />
                        </el-select>
                    </template>
                </el-input>
                <el-button disabled text>{{ t('hint.rewriteTo') }}</el-button>
                <el-input v-model="modelValue.path.replace"
                    @change="() => { if (modelValue.path.replace.trim().length === 0) { modelValue.path.replace = null } }"></el-input>

            </div>
        </el-form-item>
        <el-form-item :label="t('label.header')" v-if="modelValue.header">
            <el-col class="pr-2 space-y-1">
                <el-row v-for="headerMatch, idx in modelValue.header" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-input v-model="headerMatch.name">
                        <template #prepend>
                            <el-select v-model="headerMatch.kind" class="w-28">
                                <el-option :label="t('label.exact')" value="exact" />
                                <el-option :label="t('label.regExp')" value="reg_exp" />
                            </el-select>
                        </template>
                    </el-input>
                    <span>:</span>
                    <el-input v-if="headerMatch.kind === 'exact'" v-model="headerMatch.value"></el-input>
                    <el-input v-if="headerMatch.kind === 'reg_exp'" v-model="headerMatch.re"></el-input>
                    <el-button disabled text>{{ t('hint.rewriteTo') }}</el-button>
                    <el-input v-model="headerMatch.replace"
                        @change="() => { if (headerMatch.replace.trim().length === 0) { headerMatch.replace = null } }"></el-input>
                    <el-button :icon="Minus" @click="() => removeHeaderItem(idx)"></el-button>
                </el-row>
                <el-row class="flex justify-end items-center flex-nowrap space-x-2">
                    <el-button :icon="Plus" @click="addHeaderItem" type="primary"></el-button>
                </el-row>
            </el-col>
        </el-form-item>
        <el-form-item :label="t('label.query')" v-if="modelValue.query">
            <el-col class="pr-2 space-y-1">
                <el-row v-for="queryMatch, idx in modelValue.query" :key="idx"
                    class="flex justify-between items-center flex-nowrap space-x-2">
                    <el-select v-model="queryMatch.kind" class="w-64">
                        <el-option :label="t('label.exact')" value="exact" />
                        <el-option :label="t('label.regExp')" value="regular" />
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
        <el-form-item :label="t('label.method')" v-if="modelValue.method">
            <el-select v-model="modelValue.method" multiple placeholder="Http Methods" class="flex-grow">
                <el-option v-for="M in SG_HTTP_METHODS" :key="M" :label="M" :value="M" />
            </el-select>
        </el-form-item>
    </el-form>
</template>