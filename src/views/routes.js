import { components } from '@cortezaproject/corteza-vue'

function view (name, resolve) {
  return function (resolve) {
    return require([`./${name}.vue`], resolve)
  }
}

export default [
  { path: '/auth', name: 'auth', component: components.CDevAuthLite },
  {
    path: '/mobile',
    name: 'mobile',
    component: view('LandingMobile'),
  },
  {
    path: '',
    name: 'root',
    component: view('Messenger'),
    children: [
      { path: 'channel/new/:type', name: 'new-channel', component: view('ChannelEditor'), props: true },
      { path: 'channel/:channelID/:messageID?', name: 'channel', component: view('Channel'), props: true },
      { path: 'channel/:channelID/editor', name: 'edit-channel', component: view('ChannelEditor'), props: true },

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
]
