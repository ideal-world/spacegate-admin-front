---
aside: false
---
<script setup>
import GatewayForm from 'spacegate-admin/components/GatewayForm.vue'
import {ref} from 'vue'
const GatewayFormValue = ref({
   name: "Gateway",
   parameters: {

   },
   listeners: [],
   filters: [],
})
</script>

<DemoContainer>
   <GatewayForm v-model="GatewayFormValue"/>
</DemoContainer>