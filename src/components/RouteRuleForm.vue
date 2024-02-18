<script setup lang="ts">
import { Model } from 'spacegate-admin-client'
import { computed, ref } from 'vue';
import { Plus, Minus, Close, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import RouterMatchForm from './RouterMatchForm.vue';
import BackendForm from './BackendForm.vue';
import FilterListForm from './FilterListForm.vue';
import OptionalField from "./OptionalField.vue";

const modelValue = defineModel<Model.SgHttpRouteRule>({
    default: {
        matches: null,
        filters: [],
        backends: [],
        timeout_ms: null,
    },
})
const DEFAULT_NEW_MATCH = <Model.SgHttpRouteMatch>{
    path: null,
    header: null,
    query: null,
    method: null,
}
const newMatch = ref(<Model.SgHttpRouteMatch>{
    ...DEFAULT_NEW_MATCH
})
const addMatch = () => {
    if (modelValue.value.matches !== null) {
        modelValue.value.matches.push(newMatch.value)
        newMatch.value = {
            ...DEFAULT_NEW_MATCH
        }
    }
}
const removeMatch = (idx: number) => {
    if (modelValue.value.matches !== null) {
        modelValue.value.matches.splice(idx, 1)
    }
}
const removeBackends = (idx: number) => {
    modelValue.value.backends.splice(idx, 1)
}
const enable = ref({
    matches: computed({
        get() {
            return modelValue.value.matches !== null
        },
        set(v) {
            if (v) {
                modelValue.value.matches = []
            } else {
                modelValue.value.matches = null
            }
        }
    }),
})

const collapse = ref({
    matches: false,
    filters: false,
    backends: false,
})
</script>

<template>
    <el-form label-width="auto" label-suffix=":">
        <el-form-item label="Matches">
            <div class="flex flex-col flex-grow">
                <div class="flex justify-between items-center flex-nowrap">
                    <div class="space-x-2">
                        <el-switch v-model="enable.matches" active-text="规则" inactive-text="所有" inline-prompt></el-switch>
                    </div>
                    <el-button :icon="collapse.matches ? ArrowDown : ArrowRight"
                        @click="() => { collapse.matches = !collapse.matches }" text circle size="large"></el-button>
                </div>
                <div v-if="collapse.matches && modelValue.matches !== null"
                    class="space-y-2 flex-grow max-h-[80vh] overflow-auto">
                    <el-card v-for="backend, idx in modelValue.backends" class="relative pt-6 flex-grow" shadow="hover">
                        <el-button circle text class="absolute top-0 right-0 m-2" :icon="Close"
                            @click="() => removeBackends(idx)"></el-button>
                        <RouterMatchForm v-model="modelValue.matches[idx]"></RouterMatchForm>
                    </el-card>
                    <el-col>
                        <el-button class="w-full" :icon="Plus" @click="addMatch" type="primary"></el-button>
                    </el-col>
                </div>
            </div>
        </el-form-item>

        <el-form-item label="Filters">
            <FilterListForm v-model="modelValue.filters"></FilterListForm>
        </el-form-item>
        <el-form-item label="Backends">
            <div class="flex flex-col flex-grow">
                <div class="flex justify-between items-center flex-nowrap">
                    <el-button :icon="collapse.backends ? ArrowDown : ArrowRight"
                        @click="() => { collapse.backends = !collapse.backends }" text circle size="large"></el-button>
                </div>
                <div v-if="collapse.backends" class="space-y-2 flex-grow max-h-[80vh] overflow-auto">
                    <el-card v-for="backend, idx in modelValue.backends" class="relative pt-6 flex-grow" shadow="hover">
                        <el-button circle text class="absolute top-0 right-0 m-2" :icon="Close"
                            @click="() => removeBackends(idx)"></el-button>
                        <backend-form :model-value="backend"></backend-form>
                    </el-card>
                    <el-col>
                        <el-button class="w-full" :icon="Plus" @click="() => modelValue.backends.push({
                            host: {
                                kind: 'Host', host: 'example.com',
                            }, port: 80, timeout_ms: null, protocol: null, weight:
                                1, filters: [],
                        })" type="primary"></el-button>
                    </el-col>
                </div>
            </div>
        </el-form-item>
        <el-form-item label="Timeout" prop="timeout_ms">
            <optional-field :default="5000" v-model="modelValue.timeout_ms">
                <template #some>
                    <el-input-number v-model="(modelValue.timeout_ms as number)" placeholder="timeout"></el-input-number>
                    <span>ms</span>
                </template>
            </optional-field>
        </el-form-item>
    </el-form>
</template>