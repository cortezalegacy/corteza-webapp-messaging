import store from '@/store'
import Auth from '@/views/Auth'
import AuthSignIn from '@/views/Auth/SignIn'
import AuthSignOut from '@/views/Auth/SignOut'
import Messaging from '@/views/Apps/Messaging'
import Channel from '@/views/Apps/Messaging/Channel'
import ChannelEditor from '@/views/Apps/Messaging/ChannelEditor'
import User from '@/views/Apps/Messaging/User'
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

function protect (to, from, next) {
  next(store.getters['auth/isAuthenticated'] ? true : '/auth/signin')
}

export default new Router({
  mode: 'history',

  routes: [
    {
      path: '/',
      beforeEnter: protect,
      component: Messaging,
      children: [
        { path: 'channel/new', name: 'new-channel', component: ChannelEditor, props: true },
        { path: 'channel/:channelID', name: 'channel', component: Channel, props: true },
        { path: 'channel/:channelID/editor', name: 'edit-channel', component: ChannelEditor, props: true },
        { path: 'user/:userId', name: 'user', component: User, props: true },
      ],
    },
    {
      path: '/auth',
      component: Auth,
      redirect: '/auth/signin',

      children: [
        { path: 'signin', name: 'signin', component: AuthSignIn },
        { path: 'signout', name: 'signout', component: AuthSignOut },
      ],
    },
  ],
})
