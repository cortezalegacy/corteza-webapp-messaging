import CRM from 'corteza-webapp-messaging/src/api/crm'

export default {
  install (Vue) {
    Vue.prototype.$crm = CRM
  },
}
