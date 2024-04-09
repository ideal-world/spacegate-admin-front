---
aside: false
---
<script setup>
import RouterMatchForm from 'spacegate-admin/components/RouterMatchForm.vue'
import RouteRuleForm from 'spacegate-admin/components/RouteRuleForm.vue'
import PluginForm from 'spacegate-admin/components/PluginForm.vue'
import BackendForm from 'spacegate-admin/components/BackendForm.vue'
import {ref} from 'vue'
const headerMatchFormValue = ref({
  header: null,
  path: null,
  query: null,
  method: null
})
const routeRuleFormValue = ref({
  matches: null,
  filters: [],
  backends: [],
  timeout_ms: null,
})
const PluginFormValue = ref({
  code: 'code',
  spec: {

  }
})
const backendFormValue = ref({
  host: {
      kind: "Host",
      host: "example.com",
  },
  port: 80,
  timeout_ms: null,
  protocol: "http",
  weight: 1,
  filters: [],
})
</script>

<DemoContainer>
  <RouterMatchForm v-model="headerMatchFormValue"/>
  <code>
    {{headerMatchFormValue}}
  </code>
  <RouteRuleForm v-model="routeRuleFormValue"/> 
  <code>
    {{routeRuleFormValue}}
  </code>
  <PluginForm v-model="PluginFormValue"/>
  <BackendForm v-model="backendFormValue"/>
</DemoContainer>