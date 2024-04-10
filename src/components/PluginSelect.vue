<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, keyPluginId, labelPluginId, randomU64 } from '../utils';
import { onMounted, ref, watch } from 'vue';
import PluginForm from './PluginForm.vue';
const pluginOptions = ref<Array<string>>([])
const pluginIds = ref<Array<Model.PluginInstanceId>>([])
const code = ref()
const modelValue = defineModel<Model.PluginInstanceId | undefined>({})
defineExpose({
    save(): Promise<void> {
        if (createAnon.value) {
            return save()
        } else {
            return Promise.resolve()
        }
    }
})

const instances = ref<Model.PluginConfig[]>([])
const createAnon = ref(false)
const attr = ref<Model.PluginAttributes | undefined>()
const formRef = ref<InstanceType<typeof PluginForm>>(null)
const newConfig = ref<Model.PluginConfig>({
    code: '',
    kind: 'anon',
    uid: randomU64(),
    spec: {},
})
const save = async () => {
    if (code.value === undefined || formRef.value === null) {
        return
    }
    const spec = formRef.value.getJson();
    const id = {
        ...newConfig.value,
    }
    delete id['spec']
    await Api.postConfigPlugin({
        ...id,
        spec
    });
    modelValue.value = id
    newConfig.value = {
        code: id.code,
        kind: 'anon',
        uid: randomU64(),
        spec: {},
    }
}
const refreshPluginInstancesList = async (code: string) => {
    instances.value = unwrapResponse<Model.PluginConfig[]>(await Api.getConfigPluginsByCode(code))
    const getId = (config: Model.PluginConfig) => {
        let cloned = {
            ...config
        }
        delete cloned['spec'];
        return <Model.PluginInstanceId>{
            ...cloned
        }
    }
    pluginIds.value = instances.value.map(getId);
}
watch(code, async (code) => {
    attr.value = undefined;
    newConfig.value.code = code;
    const response = await Api.pluginAttr(code);
    attr.value = unwrapResponse<Model.PluginAttributes>(response);
    await refreshPluginInstancesList(code)
})
onMounted(async () => {
    pluginOptions.value = unwrapResponse<string[]>(await Api.pluginList());
})
</script>

<template>
    <el-switch v-model="createAnon" active-text="Create an anonymous instance" inactive-text="Select a instance"></el-switch>
    <el-form  label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item label="code">
            <el-select v-model="code">
                <el-option v-for="item in pluginOptions" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <plugin-form ref="formRef" v-if="createAnon" :attr="attr" v-model="newConfig" />
        <el-form-item v-else label="instance">
            <el-select v-model="modelValue">
                <el-option v-for="(item) in pluginIds.filter((id) => id.code === code)" :key="keyPluginId(item)" :label="labelPluginId(item)"
                    :value="item" />
            </el-select>
        </el-form-item>
    </el-form>

</template>