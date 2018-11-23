// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import { sync } from 'vuex-router-sync'
import store from './store'
import router from './router'
import core from './mixins/core'
import Favico from 'favico.js'

import './global'
import './plugins'
import './main.scss'

if (window.CrustConfig === undefined) {
  alert('Unexisting or invalid configuration. Make sure there is a public/config.js configuration file.')
} else {
  window.favicon = new Favico({
    animation: 'none',
    bgColor: '#E85568',
    fontStyle: 'lighter',
  })

  /* eslint-disable no-undef */
  console.log(
    `%cCrust Messaging, version: ${CRUST_VERSION}, build time: ${CRUST_BUILD_TIME}`,
    'background-color: #1397CB; color: white; padding: 3px 10px; border: 1px solid black; font: Courier',
  )

  // Let the kids play
  // @todo disable this when not in debug mode
  window.$store = store

  const unsync = sync(store, router)
  /* eslint-disable no-new */
  new Vue({
    name: 'crust-messenger',
    store,
    router,
    template: '<div id="crust-messenger" class="crust"><router-view/></div>',
    mixins: [ core ],
  }).$mount('#app')

  unsync()
}
