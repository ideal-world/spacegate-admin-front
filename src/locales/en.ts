export default {
  common: {
    operations: 'operations',
    operation: {
      add: 'add',
      search: 'search',
      delete: 'delete',
      cancel: 'cancel',
      submit: 'submit',
      edit: 'edit'
    },
    status: {
      success: 'success',
      fail: 'fail',
      disable: 'disable',
      enable: 'enable',
      normal: 'normal',
      abnormal: 'abnormal',
      loading: 'loading',
      submitting: 'submitting',
      searching: 'searching'
    },
    advanced: "advanced",
  },
  certificate: {
    certificates: 'certificates',
    addCertificate: 'Add Certificate',
    editCertificate: 'Edit Certificate',
    name: 'name',
    cert: 'cert',
    key: 'key',
  },
  gateway: {
    name: 'name',
    type: 'type',
    status: 'status',
    username: 'username',
    editInstance: 'Edit Instance',
    addInstance: 'Add Instance',
  },
  service: {
    name: 'name',
    listener: 'listener',
    filters: 'filters',
    plugin: 'plugin',
    addService: 'Add Service',
    editService: 'Edit Service',
  },
  route: {
    name: 'name',
    namespace: 'namespace',
    path: 'path',
    method: 'method',
    header: 'header',
    query: 'query',
    gatewayName: 'gateway name',
    hostname: 'hostname',
    service: 'service',
    servicePort: 'servicePort',
    backend: 'backend',
    filter: 'filter',
    weight: 'weight',
    timeout: 'timeout',
    protocol: 'protocol',
    addRoute: 'Add Route',
    editRoute: 'Edit Route',
  },
  upstream: {
    name: 'name',
    addUpstream: 'Add Upstream',
    editUpstream: 'Edit Upstream'
  }
}