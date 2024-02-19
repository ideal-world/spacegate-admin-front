---
aside: false
---
<script setup>
import RouteForm from 'spacegate-admin/components/RouteForm.vue'
import {ref} from 'vue'
const RouteFormValue = ref({
    gateway_name: "new gateway",
    hostnames: null,
    filters: [],
    rules: [],
    priority: 1,
})
</script>

<DemoContainer>
  <RouteForm v-model="RouteFormValue" name="new router" mode="create" gatewayName="gateway"/>
</DemoContainer>