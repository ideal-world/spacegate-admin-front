<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, keyPluginId, labelPluginId, randomUid } from '../utils';
import { onMounted, ref, watch } from 'vue';
import PluginForm from './PluginForm.vue';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const pluginOptions = ref<Array<string>>([])
const pluginIds = ref<Array<Model.PluginInstanceId>>([])
const modelValue = defineModel<Model.PluginInstanceId | undefined>({})
const code = ref<string>(modelValue.value?.code)
defineExpose({
    save(): Promise<void> {
        if (createNew.value) {
            return save()
        } else {
            return Promise.resolve()
        }
    }
})

const instances = ref<Model.PluginConfig[]>([])
const createNew = ref(false)
const attr = ref<Model.PluginAttributes | undefined>()
const formRef = ref<InstanceType<typeof PluginForm>>(null)
function pickNewName() {
    return code.value ? (code.value + '-' + randomUid()) : randomUid()
}
const newConfig = ref<Model.PluginConfig>({
    code: '',
    kind: 'named',
    name: pickNewName(),
    spec: {},
})
const save = async () => {
    if (code.value === undefined || formRef.value === null) {
        return
    }
    const spec = formRef.value.getJson();
    let id
    if (newConfig.value.kind === 'anon') {
        id = {
            code: newConfig.value.code,
            kind: newConfig.value.kind,
            uid: newConfig.value.uid,
        }
    } else if (newConfig.value.kind === 'named') {
        id = {
            code: newConfig.value.code,
            kind: newConfig.value.kind,
            name: newConfig.value.name,
        }
    } else {
        id = {
            code: newConfig.value.code,
            kind: newConfig.value.kind,
        }
    }
    await Api.postConfigPlugin({
        ...id,
        spec
    });
    await refreshPluginInstancesList(id.code);
    modelValue.value = id
    newConfig.value = {
        code: id.code,
        kind: 'named',
        name: pickNewName(),
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
async function setCode(code: string) {
    attr.value = undefined;
    newConfig.value.code = code;
    const response = await Api.pluginAttr(code);
    attr.value = unwrapResponse<Model.PluginAttributes>(response);
    await refreshPluginInstancesList(code)
}
watch(code, setCode)
watch(modelValue, (newValue) => {
    if (newValue !== undefined) {
        code.value = newValue.code
    }
})
onMounted(async () => {
    pluginOptions.value = unwrapResponse<string[]>(await Api.pluginList());
    if (modelValue.value?.code) {
        await setCode(modelValue.value.code)
    }
})
</script>

<template>
    <el-switch v-model="createNew" :active-text="t('hint.createAnInstance')"
        :inactive-text="t('hint.selectAnInstance')"></el-switch>
    <el-form label-width="auto" label-suffix=":" class="space-y-1">
        <el-form-item :label="t('label.code')">
            <el-select v-model="code">
                <el-option v-for="item in pluginOptions" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <plugin-form ref="formRef" v-if="createNew" :attr="attr" v-model="newConfig" />
        <el-form-item v-else :label="t('label.instance')">
            <el-select v-model="modelValue">
                <el-option v-for="(item) in pluginIds.filter((id) => id.code === code && id.kind === 'named')"
                    :key="keyPluginId(item)" :label="labelPluginId(item)" :value="item" />
            </el-select>
        </el-form-item>
    </el-form>

</template>