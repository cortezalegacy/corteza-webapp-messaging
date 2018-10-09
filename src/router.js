import store from '@/store'
import Auth from '@/views/Auth'
import AuthSignIn from '@/views/Auth/SignIn'
import AuthSignOut from '@/views/Auth/SignOut'
import Messanger from '@/views/Messanger'
import Channel from '@/views/Channel'
import ChannelEditor from '@/views/ChannelEditor'
import ChannelMembers from '@/views/ChannelMembers'
import User from '@/views/User'
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

function protect (to, from, next) {
  next(store.getters['auth/isAuthenticated'] ? true : { name: 'signin' })
}

export default new Router({
  mode: 'history',

  routes: [
    {
      name: 'root',
      path: '/messaging/',
      beforeEnter: protect,
      component: Messanger,
      children: [
        { path: 'channel/new', name: 'new-channel', component: ChannelEditor, props: true },
        { path: 'channel/:channelID', name: 'channel', component: Channel, props: true },
        { path: 'channel/:channelID/editor', name: 'edit-channel', component: ChannelEditor, props: true },
        { path: 'channel/:channelID/members', name: 'members', component: ChannelMembers, props: true },
        { path: 'user/:userId', name: 'user', component: User, props: true },
      ],
    },
    {
      path: '/messaging/auth',
      component: Auth,
      redirect: { name: 'signin' },

      children: [
        { path: 'signin', name: 'signin', component: AuthSignIn },
        { path: 'signout', name: 'signout', component: AuthSignOut },
      ],
    },
  ],
})
