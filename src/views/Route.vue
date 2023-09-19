<script setup lang="ts">
import { reactive } from 'vue'
import { Search,Edit } from '@element-plus/icons-vue'

import { useI18n } from '../i18n/usei18n'

const t = await useI18n()

const tableData = [
  {
    name: 'iam-test',
    namespace: 'idp',
    priority: '0',
    updateTime:'2016-05-03 10::20::00'
  },
  ]
  interface Route{
    name:String,
    namespace:String,
    updateTime:Date,
  };
  const handleEdit = (index: number, row: Route) => {
  console.log(index, row)
}

const form = reactive({
  name: '',
  namespace: '',
  currentPage:1,
  pageSize:10,
})

const onSubmit=()=>{

}
const handleDelete = (index: number, row: Route) => {
  console.log(index, row)
}
</script>
<template>
  <el-form :inline="true" :model="form" >
    <el-form-item :label="t('route.name')">
      <el-input placeholder="name of route" v-model="form.name" />
    </el-form-item>
    <el-form-item label="namespace">
      <el-input placeholder="namespace of route" v-model="form.namespace" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" plain round :icon="Search" @click="onSubmit">search</el-button>
      <el-button type="primary" plain round :icon="Edit" >create</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="tableData" border stripe height="250" max-height="250" style="width: 100% ">
    <el-table-column prop="name" label="Name" width="180" />
    <el-table-column prop="namespace" label="Namespace" width="180" />
    <el-table-column prop="priority" label="Priority" />
    <el-table-column prop="updateTime" label="Update Time" />
    <el-table-column label="Operations">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.$index, scope.row)"
          >Edit</el-button
        >
        <el-button
          size="small"
          type="danger"
          @click="handleDelete(scope.$index, scope.row)"
          >Delete</el-button
        >
      </template>
    </el-table-column>
  </el-table>
  <el-pagination
      v-model:current-page="form.currentPage"
      v-model:page-size="form.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :disabled="false"
      layout="total, sizes, prev, pager, next, jumper"
      :total="100"
      @size-change="()=>{}"
      @current-change="()=>{}"
    />
</template>