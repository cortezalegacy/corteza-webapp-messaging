import store from '@/store'
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

function protect (to, from, next) {
  next(store.getters['auth/isAuthenticated'] ? true : '/messaging/auth/signin')
}

export default new Router({
  mode: 'history',

  routes: [
    {
      path: '/messaging/',
      name: 'root',
      beforeEnter: protect,
      component: view('Messenger'),
      children: [
        { path: 'channel/new', name: 'new-channel', component: view('ChannelEditor'), props: true },
        { path: 'channel/:channelID', name: 'channel', component: view('Channel'), props: true },
        { path: 'channel/:channelID/editor', name: 'edit-channel', component: view('ChannelEditor'), props: true },
        { path: 'channel/:channelID/members', name: 'members', component: view('ChannelMembers'), props: true },

        { path: 'threads', name: 'threads', component: view('Threads') },
        { path: 'unreads', name: 'unreads', component: view('Unreads') },
      ],
    },
    {
      path: '/messaging/auth',
      component: view('Auth'),
      redirect: '/messaging/auth/signin',

      children: [
        { path: 'signin', name: 'signin', component: view('Auth/SignIn') },
        { path: 'signout', name: 'signout', component: view('Auth/SignOut') },
      ],
    },
    {
      path: '*',
      redirect: { name: 'root' },
    },
  ],
})

function view (name, resolve) {
  return function (resolve) {
    return require([`./views/${name}`], resolve)
  }
}

