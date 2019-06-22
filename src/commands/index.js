import i18next from 'i18next'
import { debounce } from 'lodash'
const debounceTimeout = 1000

const gifHandler = function ({ middleware, afterware, $externalContent, msg } = {}) {
  if (middleware) {
    middleware()
  }

  const exec = (/^.+ (.+)$/g).exec(msg)
  let query
  if (exec) {
    query = exec[1]
  }

  $externalContent.get({ ...this.params, params: { query } }).then(afterware)
}

export default [
  // @todo refactor triggers a bit...
  // {
  //   command: 'join',
  //   handler: (vm, [ channelID ]) => {
  //     channelID = makeIdParserRegex().exec(channelID)
  //     if (channelID) {
  //       vm.$router.push({ name: 'channel', params: { channelID: channelID[2] } })
  //     }
  //   },
  // },

  // Active commands
  {
    command: 'gif',
    description: i18next.t('commands.gifDescription'),
    meta: {},
    params: {},
    active: true,
    match: (msg) => (/^\/gif .*$/).test(msg),
    handler: debounce(gifHandler, debounceTimeout),
  },

  {
    command: 'giphy',
    description: i18next.t('commands.giphyDescription'),
    meta: {},
    params: { provider: 'giphy' },
    active: true,
    match: (msg) => (/^\/giphy .*$/).test(msg),
    handler: debounce(gifHandler, debounceTimeout),
  },

  // Passive commands
  {
    command: 'mute',
    description: i18next.t('commands.muteAllDescription'),
    handler: (vm) => {
      console.debug('Setting mute.all to true')
      vm.$store.commit('settings/set', { key: 'mute.all', value: true })
    },
  },

  {
    command: 'unmute',
    description: i18next.t('commands.unmuteAllDescription'),
    handler: (vm) => {
      console.debug('Setting mute.all to false')
      vm.$store.commit('settings/set', { key: 'mute.all', value: false })
    },
  },
].map(cmd => {
  cmd.meta = Object.assign(
    { id: 'local/' + cmd.command },
    cmd.meta || {}
  )

  return cmd
})
