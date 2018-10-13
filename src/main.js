// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './views/Index'
import { sync } from 'vuex-router-sync'
import store from './store'
import router from './router'

import './global'
import './plugins'
import './main.scss'

if (window.CrustConfig === undefined) {
  alert('Unexisting or invalid configuration. Make sure there is a public/config.js configuration file.')
} else {
  const unsync = sync(store, router)

  /* eslint-disable no-new */
  new Vue({
    store,
    router,
    render: h => h(App),
  }).$mount('#app')

  unsync()
}
