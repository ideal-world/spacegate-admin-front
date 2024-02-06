---
aside: false
---
<script setup>
import HeaderMatchForm from 'spacegate-admin/components/HeaderMatchForm.vue'
import {ref} from 'vue'
const headerMatchFormValue = ref({
  kind: 'exact',
  value: '111'
})
</script>

<DemoContainer>
  <HeaderMatchForm v-model="headerMatchFormValue" clearable/>
  <code>
    {{headerMatchFormValue}}
  </code>
</DemoContainer>