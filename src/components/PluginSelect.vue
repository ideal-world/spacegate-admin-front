<script setup lang="ts">
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse, keyPluginId, labelPluginId, randomUid } from '../utils';
import { computed, onMounted, ref, watch } from 'vue';
import PluginForm from './PluginForm.vue';
import { useI18n } from 'vue-i18n'
const { locale, t } = useI18n();
const pluginOptions = ref<Array<string>>([])
const pluginIds = ref<Array<Model.PluginInstanceId>>([])
const modelValue = defineModel<Model.PluginInstanceId | undefined>({})
const code = ref<string | undefined>(modelValue.value?.code)
defineExpose({
    save(): Promise<void> {
        if (configMode.value === 'custom') {
            return save()
        } else {
            return Promise.resolve()
        }
    }
})

const instances = ref<Model.PluginConfig[]>([])
const configMode = ref<'reference' | 'custom'>('reference')
const attr = ref<Model.PluginAttributes | undefined>()
const formRef = ref<InstanceType<typeof PluginForm>>(null)
const texts = computed(() => locale.value.startsWith('zh') ? {
    referenceHint: '引用已经保存的 named 插件配置，适合多条路由复用同一份参数。',
    customHint: '创建一份新的 named 插件配置，保存后会立即绑定到当前资源。',
    selectPluginType: '请选择插件类型',
    selectPluginTypeDesc: '选择插件类型后会加载对应 schema，并显示自定义插件配置编辑器。',
    emptyConfig: '当前插件类型还没有可引用的 named 配置，可切换到“自定义插件配置”创建。',
} : {
    referenceHint: 'Reference an existing named plugin configuration. Use this when multiple routes share the same parameters.',
    customHint: 'Create a new named plugin configuration and bind it to the current resource after saving.',
    selectPluginType: 'Select a plugin type',
    selectPluginTypeDesc: 'After selecting a plugin type, the schema loads and the custom configuration editor appears.',
    emptyConfig: 'This plugin type has no named configuration to reference. Switch to Custom plugin configuration to create one.',
})
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
    let id: Model.PluginInstanceId
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
    newConfig.value.name = pickNewName();
    const response = await Api.pluginAttr(code);
    attr.value = unwrapResponse<Model.PluginAttributes>(response);
    await refreshPluginInstancesList(code)
}
watch(code, async (pluginCode) => {
    if (pluginCode) {
        await setCode(pluginCode)
    }
})
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
    <div class="plugin-select">
        <el-segmented
            v-model="configMode"
            class="plugin-select__mode"
            :options="[
                { label: t('hint.selectAnInstance'), value: 'reference' },
                { label: t('hint.createAnInstance'), value: 'custom' },
            ]"
        />
        <div class="plugin-select__mode-hint">
            {{ configMode === 'reference' ? texts.referenceHint : texts.customHint }}
        </div>
    </div>
    <el-form label-position="top" class="plugin-select__form">
        <el-form-item :label="t('label.code')">
            <el-select filterable v-model="code">
                <el-option v-for="item in pluginOptions" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <plugin-form ref="formRef" v-if="configMode === 'custom' && attr" :attr="attr" v-model="newConfig" />
        <el-alert
            v-else-if="configMode === 'custom'"
            type="info"
            :closable="false"
            :title="texts.selectPluginType"
            :description="texts.selectPluginTypeDesc"
        />
        <el-form-item v-else :label="t('label.instance')">
            <el-select filterable v-model="modelValue">
                <el-option v-for="(item) in pluginIds.filter((id) => id.code === code && id.kind === 'named')"
                    :key="keyPluginId(item)" :label="labelPluginId(item)" :value="item" />
            </el-select>
            <div class="plugin-select__empty-hint" v-if="code && pluginIds.filter((id) => id.code === code && id.kind === 'named').length === 0">
                {{ texts.emptyConfig }}
            </div>
        </el-form-item>
    </el-form>

</template>

<style scoped>
.plugin-select {
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f8fafc;
}

.plugin-select__mode {
    width: 100%;
}

.plugin-select__mode-hint,
.plugin-select__empty-hint {
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
}

.plugin-select__form {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
</style>
