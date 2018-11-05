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
  {
    command: 'mute',
    description: 'Mute all notifications',
    handler: (vm) => {
      console.debug('Setting mute.all to true')
      vm.$store.commit('settings/set', { key: 'mute.all', value: true })
    },
  },

  {
    command: 'unmute',
    description: 'Mute all notifications',
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
