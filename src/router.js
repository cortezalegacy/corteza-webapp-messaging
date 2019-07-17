import Router from 'vue-router'
import routes from './views/routes'

export default new Router({
  base: '/messaging',
  mode: 'history',
  routes,
})
