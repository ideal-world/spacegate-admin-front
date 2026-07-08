<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>

<template>
  <pre class="plugin-markdown">{{ content }}</pre>
</template>

<style scoped>
.plugin-markdown {
  margin: 0;
  padding: 16px;
  color: #303133;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
