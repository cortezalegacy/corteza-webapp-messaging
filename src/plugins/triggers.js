const LOCAL_COMMANDS = {
  'join': {
    local: true,
    handler: (vm, [ channelID ]) => {
      channelID = makeIdParserRegex().exec(channelID)
      if (channelID) {
        vm.$router.push({ name: 'channel', params: { channelID: channelID[2] } })
      }
    },
  },
}

const TRIGGERS = {
  '/': { type: 'command', constraints: { index: 0 } },
  '@': { type: 'user' },
  '#': { type: 'channel' },
}

function makeIdParserRegex () {
  let r = Object.keys(TRIGGERS).join('')
  return new RegExp(`[<]([${r}])(.*)[>]`)
}

export default {
  install (Vue, options) {
    Vue.prototype.$triggers = {
      userByID: options.userByID,
      channelByID: options.channelByID,

      isLocalCommand (command) {
        return LOCAL_COMMANDS[command] || {}
      },

      // Checks if chunk is triggered and if so, gives the trigger
      isTriggered (chunk = '') {
        return TRIGGERS[chunk[0]] || false
      },

      // Tells if char has a trigger
      isTrigger (chunk = '') {
        return !!this.isTriggered(chunk)
      },

      // Checks trigger's constraints
      checkTriggerConstraints (chunk = '', msg = {}) {
        let trigger = this.isTriggered(chunk)
        if (!trigger) return true
        let { constraints } = trigger
        if (!constraints) return true

        // Correct index
        if (constraints.index !== undefined && constraints.index !== msg.index) return false
        return true
      },

      // Parses triggered api chunks
      parse (chunks) {
        let regex = makeIdParserRegex()
        let buffer = []
        let rtr = []

        for (let chunk of chunks) {
          /**
           * m[0] - entire match
           * m[1] - trigger
           * m[2] - ID
           */
          let m = regex.exec(chunk)

          // Is triggered...
          if (m) {
            let parsed = buffer.join(' ')
            rtr.push({ chunk: parsed, meta: {}, props: {}, triggered: false })
            buffer = []

            let { type } = this.isTriggered(m[1])
            parsed = type === 'user'
              ? (this.userByID(m[2]) || {}).username
              : (this.channelByID(m[2]) || {}).name

            let paramName = type === 'user'
              ? 'userId'
              : 'channelID'

            let params = {}
            params[paramName] = m[2]

            parsed = {
              chunk: `<mark><b>${m[1]}</b>${parsed}</mark>`,
              meta: { tag: 'router-link' },
              props: { to: { name: type, params } },
              triggered: true,
            }

            rtr.push(parsed)
          } else {
            buffer.push(chunk)
          }
        }

        if (buffer.length) {
          rtr.push({ chunk: buffer.join(' '), meta: {}, props: {}, triggered: false })
        }
        return rtr
      },
    }
  },
}
