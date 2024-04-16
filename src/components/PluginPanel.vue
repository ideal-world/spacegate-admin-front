<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Api, Model } from 'spacegate-admin-client'
import { unwrapResponse } from '../utils'
import { Plus, Delete, Check, Edit } from '@element-plus/icons-vue'
import { PluginForm } from '.';
import { PluginConfig } from 'spacegate-admin-client/dist/model';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n'
const { t } = useI18n();
const codeOptions = ref([]);
const code = ref<string | undefined>();
const attr = ref<Model.PluginAttributes | undefined>();
const instances = ref<Model.PluginConfig[]>();
const searchText = ref<string>('');
const formPluginConfig = ref<PluginConfig>({
    code: '',
    kind: 'named',
    name: '',
    spec: {},
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogMode = ref<'create' | 'edit'>('create');
const formRef = ref<InstanceType<typeof PluginForm>>(null);
onMounted(async () => {
    const response = await Api.pluginList();
    codeOptions.value = unwrapResponse<string[]>(response);
})
const refreshPluginInstancesList = async (code: string) => {
    instances.value = unwrapResponse<Model.PluginConfig[]>(await Api.getConfigPluginsByCode(code))
}
watch(code, async (code) => {
    attr.value = undefined;
    const response = await Api.pluginAttr(code);
    attr.value = unwrapResponse<Model.PluginAttributes>(response);
    await refreshPluginInstancesList(code)
})

const openCreateDialog = () => {
    if (attr.value !== undefined) {
        if (attr.value.mono) {
            formPluginConfig.value = {
                code: attr.value.code,
                kind: 'mono',
                spec: {},
            }
        } else {
            formPluginConfig.value = {
                code: attr.value.code,
                kind: 'named',
                name: 'new-instance',
                spec: {},
            }
        }
    }
    dialogMode.value = 'create';
    dialogTitle.value = `Create Instance`;
    dialogVisible.value = true;
}
const closeDialog = async (action: 'save' | 'cancel') => {
    if (action === 'save') {
        try {
            await savePlugin();
            dialogVisible.value = false;
            await refreshPluginInstancesList(code.value);
        } catch (e) {
            ElMessage.error(e.message);
        }
    } else {
        dialogVisible.value = false;
    }
}

const savePlugin = async () => {
    if (dialogMode.value === 'create') {
        await createPlugin();
    } else {
        await updatePlugin();
    }
}
const editInstance = async (instance: Model.PluginConfig) => {
    dialogMode.value = 'edit';
    dialogTitle.value = `Edit Instance`;
    formPluginConfig.value = instance;
    dialogVisible.value = true;
}
const deleteInstance = async (instance: Model.PluginConfig) => {
    const action = await ElMessageBox.confirm('Are you sure to delete this plugin instance?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
    });
    if (action === 'confirm') {
        await Api.deleteConfigPlugin(instance);
        await refreshPluginInstancesList(code.value);
    }
}
const createPlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <Model.PluginConfig>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.postConfigPlugin(config);
}
const updatePlugin = async () => {
    if (formRef.value === null) {
        return;
    }
    const config = <Model.PluginConfig>{
        ...formPluginConfig.value,
        spec: formRef.value.getJson(),
    }
    await Api.putConfigPlugin(config);
}
</script>
<template>
    <el-select filterable v-model="code">
        <el-option v-for="pluginCode in codeOptions" :label="pluginCode" :value=pluginCode></el-option>
    </el-select>
    <el-descriptions v-if="attr" border>

        <el-descriptions-item label="Code">{{ attr.code }}</el-descriptions-item>
        <el-descriptions-item label="Version">{{ attr.meta.version }}</el-descriptions-item>
        <el-descriptions-item label="Mono">
            {{ attr.mono ? '✔️' : '❌' }}
        </el-descriptions-item>
        <el-descriptions-item label="Authors">{{ attr.meta.authors }}</el-descriptions-item>
        <el-descriptions-item label="Homepage">
            <el-link v-if="attr.meta.homepage" :href="attr.meta.homepage" target="_blank">{{ attr.meta.homepage
                }}</el-link>
        </el-descriptions-item>
        <el-descriptions-item label="Repository">
            <el-link v-if="attr.meta.repository" :href="attr.meta.repository" target="_blank">{{ attr.meta.repository
                }}</el-link>
        </el-descriptions-item>
        <el-descriptions-item label="Description">{{ attr.meta.description }}</el-descriptions-item>
    </el-descriptions>
    <div v-if="attr !== undefined && attr.mono">

    </div>
    <div v-if="attr !== undefined && !attr.mono && instances !== undefined">
        <div class="flex items-start space-x-2">
            <el-input v-model="searchText" placeholder="Search Instance Name"></el-input>
            <el-button :icon="Plus" type="primary" @click="openCreateDialog">{{t('button.create')}}</el-button>
        </div>
        <div class="flex flex-wrap items-start space-y-2 space-x-2">

            <el-card v-for="instance in instances.filter((c) => {
                return c.kind === 'named' && (searchText === '' ? true : c.name.includes(searchText))
            })" class="inline-block flex justify-between border-b border-gray-300 p-2 my-2" shadow="hover">
                <span class="flex-grow mx-2">{{ instance.kind === 'named' ? instance.name : undefined }}</span>
                <el-button-group>
                    <el-button size="small" :icon="Edit" type="primary"
                        @click="() => editInstance(instance)">{{t('button.edit')}}</el-button>
                    <el-button size="small" :icon="Delete" type="danger"
                        @click="() => deleteInstance(instance)">{{t('button.delete')}}</el-button>
                </el-button-group>
            </el-card>
        </div>
        <el-dialog v-model="dialogVisible" :title="dialogTitle">
            <template #title>
                <code class="border rounded px-2 mx-2">{{ attr.code }}</code>
                <span>{{ dialogTitle }}</span>
            </template>
            <plugin-form ref="formRef" :attr="attr" v-model="formPluginConfig"></plugin-form>
            <template #footer>
                <el-button :icon="Delete" @click="() => closeDialog('cancel')">{{t('button.cancel')}}</el-button>
                <el-button :icon="Check" type="primary" @click="() => closeDialog('save')">{{t('button.save')}}</el-button>
            </template>
        </el-dialog>
    </div>

</template>