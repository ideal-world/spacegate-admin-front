<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'
import { Api } from 'spacegate-admin-client'
const { t } = useI18n();
const username = ref('');
const password = ref('');
const login = async () => {
    try {
        await Api.authLogin(username.value, password.value)
    } catch (e) {

    }
}
defineExpose({ login })
</script>

<template>

    <el-form label-width="auto" class="w-full flex-col">
        <el-form-item :label="t('label.username')">
            <el-input v-model="username">

            </el-input>
        </el-form-item>
        <el-form-item type="password" :label="t('label.password')">
            <el-input show-password v-model="password">

            </el-input>
        </el-form-item>
    </el-form>
</template>
