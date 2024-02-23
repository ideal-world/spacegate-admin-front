---
aside: false
---
<script setup>
import Select from 'spacegate-admin/components/SelectGateway.vue'
import { ref } from 'vue'
const routeName = ref()
</script>

<DemoContainer>
    <Select v-model="routeName"/>
</DemoContainer>