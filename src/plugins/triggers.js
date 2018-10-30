const TRIGGERS = {
  '/': { type: 'command', constraints: { index: 0 } },
  '@': { type: 'user' },
  '#': { type: 'channel' },
}

function makeIdParserRegex (flags = '') {
  /**
   * m[0] - entire match
   * m[1] - trigger
   * m[2] - ID
   */
  let r = Object.keys(TRIGGERS).join('')
  return new RegExp(`<([${r}])(\\d+)>`, flags)
}

export default {
  install (Vue, options) {
    Vue.prototype.$triggers = {
      userByID: options.userByID,
      channelByID: options.channelByID,

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
        if (!trigger) return false
        let { constraints } = trigger
        if (!constraints) return true

        // Correct index
        if (constraints.index !== undefined && constraints.index !== msg.index) return false
        return true
      },

      /**
       * Goes through the given text with the given regex, and handles nodes based
       * on callback functions
       * @param {RegExp} regex
       * @param {String} message
       * @param {function} regular
       * @param {function} triggered
       * @param {*} wrapper Wrapper to contain processed data. Must be a ref
       */
      traverseMessage (regex, message, regularChunkHandler, triggeredChunkHandler, wrapper) {
        let lists = { '@': this.userByID, '#': this.channelByID }

        let match
        let lastProcessed = 0
        let unprocessedMsg = message
        while ((match = regex.exec(message))) {
          // Get index of matched chunk
          let [ entire, trigger, id ] = match
          let triggeredIndex = unprocessedMsg.indexOf(entire)

          // Get normal and triggered chunks
          let normalChunk = unprocessedMsg.substring(0, triggeredIndex)
          let triggeredChunk = unprocessedMsg.substring(triggeredIndex, triggeredIndex + entire.length)

          // Handle regular chunk
          if (normalChunk) regularChunkHandler(normalChunk, wrapper)

          // Get triggered node's text
          let object = (lists[trigger](id)) || {}
          let triggeredText = object.name || object.username

          // Handle triggered chunk
          triggeredChunkHandler(wrapper, trigger, triggeredText, { id })

          // Update lastProcessed index -- don't edit message it self because, regex is using it
          lastProcessed = triggeredIndex + triggeredChunk.length
          unprocessedMsg = unprocessedMsg.substring(lastProcessed)
        }

        // Insert last normal chunk
        if (unprocessedMsg) {
          regularChunkHandler(unprocessedMsg, wrapper)
        }
      },

      getChunks (text) {
        let rows = text.trim().split(/[\n]/)
        let rtr = []
        if (!text.trim()) return []
        for (let r of rows) {
          rtr = [...rtr, this.getLineChunks(r)]
        }
        return rtr
      },

      // Prepares chunks for history
      getLineChunks (message) {
        // Regex
        let regex = makeIdParserRegex('g')

        // Triggered handler
        let triggeredChunkHandler = (wrapper, trigger, triggeredText, meta) => {
          let { type } = this.isTriggered(triggeredText)

          let paramName = type === 'user'
            ? 'userId'
            : 'channelID'

          let params = {}
          params[paramName] = meta.id

          triggeredText = {
            chunk: `<mark><b>${trigger}</b>${triggeredText}</mark>`,
            meta: { tag: 'router-link' },
            props: { to: { name: type, params } },
            triggered: true,
          }

          wrapper.push(triggeredText)
        }

        // Regular handler
        let regularChunkHandler = (message, wrapper) => {
          wrapper.push({ chunk: message, meta: {}, props: {}, triggered: false })
        }

        // Wrapper
        let wrapper = []

        // Traverse
        if (message) {
          this.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, wrapper)
        } else {
          regularChunkHandler('<br>', wrapper)
        }
        return wrapper
      },


      // # Handles strings from API

      // Gives nodes per line
      getNodes (message) {
        let wrapper = document.createElement('div')

        if (!message) return wrapper

        for (let m of message.split('\n')) {
          wrapper.appendChild(this.getLineNodes(m))
        }

        return wrapper
      },

      // Processes message to DOM node structure
      getLineNodes (message) {
        // Regex
        let regex = makeIdParserRegex('g')

        // Triggered handler
        let triggeredChunkHandler = (wrapper, trigger, triggeredText, meta) => {
          // Create a triggered node
          let triggeredNode = document.createElement('span')
          if (this.prepareTriggeredNode(triggeredNode, trigger, triggeredText).trigger) {
            this.addNodeTrigger(triggeredNode, trigger, meta)
          }
          wrapper.appendChild(triggeredNode)
        }

        // Regular handler
        let regularChunkHandler = (message, wrapper) => {
          let normalNode = document.createElement('span')
          normalNode.appendChild(document.createTextNode(message))
          wrapper.appendChild(normalNode)
        }

        let wrapper = document.createElement('p')
        if (message) {
          this.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, wrapper)
        } else {
          let buffer = document.createElement('span')
          buffer.appendChild(document.createElement('br'))
          wrapper.appendChild(buffer)
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
