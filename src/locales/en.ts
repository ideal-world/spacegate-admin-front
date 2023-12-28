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
    addCertificate: 'add certificate',
    editCertificate: 'edit certificate',
    name: 'name',
    cert: 'cert',
    key: 'key',
  },
  gateway: {
    name: 'name',
    type: 'type',
    status: 'status',
    username: 'username',

  },
  service: {
    name: 'name',
    listener: 'listener',
    filters: 'filters',
    plugin: 'plugin',
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
    addRoute: 'addRoute',
    editRoute: 'editRoute',
  },
  upstream: {
    name: 'name'
  }
}