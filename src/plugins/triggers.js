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

      getChunks (text) {
        let rows = text.trim().split(/[\n]/)
        let rtr = []
        for (let r of rows) {
          rtr = [...rtr, this.getLineChunks(r.trim().split(/[ ]/))]
        }
        return rtr
      },

      // Prepares chunks for history
      getLineChunks (chunks) {
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

      // # Handles strings from API

      // Gives nodes per line
      getNodes (message) {
        let wrapper = document.createElement('div')
        for (let m of message.split('\n')) {
          wrapper.append(this.getLineNodes(m))
        }

        return wrapper.innerHTML
      },

      // Processes message to DOM node structure
      getLineNodes (message) {
        let lists = { '@': this.userByID, '#': this.channelByID }

        /**
         * m[0] - entire match
         * m[1] - trigger
         * m[2] - ID
         */
        let regex = /<([#@])(\d+)>/g

        let addNormalChunk = (message, wrapper) => {
          let normalNode = document.createElement('span')
          normalNode.appendChild(document.createTextNode(message))
          wrapper.appendChild(normalNode)
        }

        let match
        let lastProcessed = 0
        let wrapper = document.createElement('p')
        let unprocessedMsg = message
        while ((match = regex.exec(message)) !== null) {
          // Get index of matched chunk
          let [ entire, trigger, id ] = match
          let triggeredIndex = unprocessedMsg.indexOf(entire)

          // Get normal and triggered chunks
          let normalChunk = unprocessedMsg.substring(0, triggeredIndex)
          let triggeredChunk = unprocessedMsg.substring(triggeredIndex, triggeredIndex + entire.length)

          // Create normal node
          addNormalChunk(normalChunk, wrapper)

          // Get node's text...
          let object = (lists[trigger](id)) || {}
          let triggeredText = object.name || object.username

          // Create a triggered node
          let triggeredNode = document.createElement('span')
          if (this.prepareTriggeredNode(triggeredNode, trigger, triggeredText).trigger) {
            this.addNodeTrigger(triggeredNode, trigger, { id })
          }
          wrapper.appendChild(triggeredNode)

          // Update lastProcessed index -- don't edit message it self because, regex is using it
          lastProcessed = triggeredIndex + triggeredChunk.length
          unprocessedMsg = unprocessedMsg.substring(lastProcessed)
        }

        // Insert last normal chunk

        if (unprocessedMsg) {
          addNormalChunk(unprocessedMsg, wrapper)
        }

        return wrapper
      },

      // # Node trigger handlers

      prepareTriggeredNode (node, trigger, text) {
        if (trigger === '/') {
          node.appendChild(document.createTextNode(`${trigger}${text}`))
          return { trigger: false }
        } else {
          node.classList.add('triggered')
          node.appendChild(document.createTextNode(`${trigger}${text}`))
          return { trigger: true }
        }
      },

      addNodeTrigger (node, trigger, meta) {
        node.classList.add('valid')

        node.dataset.triggered = true
        node.dataset.prefix = trigger
        node.dataset.meta = JSON.stringify(meta)

        delete node.dataset.invalid
      },

      removeNodeTrigger (node) {
        delete node.dataset.prefix
        delete node.dataset.meta

        node.dataset.invalid = true
        node.classList.remove('valid')
      },
    }
  },
}
