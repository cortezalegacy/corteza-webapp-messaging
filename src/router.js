import Vue from 'vue'
import Router from 'vue-router'
import { ChangePassword, ConfirmEmail, Logout, RequestPasswordReset, ResetPassword, ViewProfile, Login, Signup } from 'crust-auth'

Vue.use(Router)

export default new Router({
  base: process.env.VUE_APP_CORDOVA ? '' : '/messaging/',
  mode: process.env.VUE_APP_ROUTER_MODE || 'history',

  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: view('Auth'),
      children: [
        { path: 'login',
          name: 'login',
          component: Login },

        { path: 'logout',
          name: 'logout',
          component: Logout },

        { path: 'signup',
          name: 'signup',
          component: Signup },

        {
          path: 'request-password-reset',
          name: 'request-password-reset',
          component: RequestPasswordReset },

        {
          path: 'reset-password',
          name: 'reset-password',
          component: ResetPassword },

        { path: 'confirm-email',
          name: 'confirm-email',
          component: ConfirmEmail },

        { path: 'profile',
          name: 'profile',
          component: ViewProfile },

        { path: 'change-password',
          name: 'change-password',
          component: ChangePassword },

        { path: '*',
          redirect: { name: 'login' } },
      ],
    },

    {
      path: '',
      name: 'root',
      component: view('Messenger'),
      children: [
        { path: 'channel/new/:type', name: 'new-channel', component: view('ChannelEditor'), props: true },
        { path: 'channel/:channelID', name: 'channel', component: view('Channel'), props: true },
        { path: 'channel/:channelID/editor', name: 'edit-channel', component: view('ChannelEditor'), props: true },
        { path: 'channel/:channelID/members', name: 'members', component: view('ChannelMembers'), props: true },

        { path: 'user/:userID', name: 'profile', component: view('Profile'), props: true },

        { path: 'threads', name: 'threads', component: view('Threads') },
        { path: 'unreads', name: 'unreads', component: view('Unreads') },
        { path: '*', name: 'landing', component: view('Landing') },
      ],
    },
    {
      path: '*',
      redirect: { name: 'root' },
    },
    {
      path: '/mobile',
      name: 'mobile',
      component: view('LandingMobile'),
    },
  ],
})

function view (name, resolve) {
  return function (resolve) {
    return require([`./views/${name}.vue`], resolve)
  }
}
