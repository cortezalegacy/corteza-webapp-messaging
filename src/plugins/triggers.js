const TRIGGERS = {
  '/': { type: 'command', constraints: { index: 0 } },
  '@': { type: 'user' },
  '#': { type: 'channel' },
}

const ROUTES = {
  user: {
    params: [ { userId: 'id' } ],
    // Todo:
    route: undefined,
  },
  channel: {
    params: [ { channelID: 'id' } ],
    // Todo:
    route: 'channel',
  },
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
      userList: options.userList,
      channelList: options.channelList,

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
       * @param {function} triggeredTextGetter -- determines how text for the triggered node is generated
       * @param {*} wrapper Wrapper to contain processed data. Must be a ref
       */
      traverseMessage (regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper) {
        let match
        let lastProcessed = 0
        let unprocessedMsg = message
        while ((match = regex.exec(message))) {
          // Get index of matched chunk
          match = matchDestructor(match)
          let { entire, trigger, id } = match
          let triggeredIndex = unprocessedMsg.indexOf(entire)

          // Get normal and triggered chunks
          let normalChunk = unprocessedMsg.substring(0, triggeredIndex)
          let triggeredChunk = unprocessedMsg.substring(triggeredIndex, triggeredIndex + entire.length)

          // Handle regular chunk
          if (normalChunk) regularChunkHandler(normalChunk, wrapper)

          // Get triggered node's text
          let { triggeredText } = triggeredTextGetter(match)

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
        return this.getLineChunks(text)
      },

      // Prepares chunks for history
      getLineChunks (message) {
        // Regex
        let regex = makeIdParserRegex('g')

        // Triggered handler
        let triggeredChunkHandler = (wrapper, trigger, triggeredText, meta) => {
          let content, params, node
          // , href

          // Link
          node = document.createElement('a')

          /// / Text node
          content = `${trigger}${triggeredText}`
          node.appendChild(document.createTextNode(content))

          /// / Params
          let { type } = this.isTriggered(trigger)
          let { params: paramsDef, route } = ROUTES[type] || {}

          params = {}
          // Collect required params
          for (let p of paramsDef) {
            let [ param, raw ] = Object.entries(p)[0]
            params[param] = meta[raw]
          }
          node.dataset.params = JSON.stringify(params)

          /// / Route name
          node.dataset.route = route

          /// / Href - TODO -- need $router instance
          // href = this.$router.resolve({ name: route, params })
          // node.href = href
          node.href = '#'

          wrapper.message += node.outerHTML
        }

        // Regular handler
        let regularChunkHandler = (message, wrapper) => {
          wrapper.message += message
        }

        let lists = { '@': this.userByID, '#': this.channelByID }
        let triggeredTextGetter = (match) => {
          let { trigger, id } = match

          let object = (lists[trigger](id)) || {}
          let triggeredText = object.name || object.username
          return { triggeredText }
        }

        let matchDestructor = (match) => {
          let [ entire, trigger, id ] = match
          return { entire, trigger, id }
        }

        // Wrapper
        let wrapper = { message: `` }

        // Traverse
        this.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
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

        let lists = { '@': this.userByID, '#': this.channelByID }
        let triggeredTextGetter = (match) => {
          let { trigger, id } = match

          let object = (lists[trigger](id)) || {}
          let triggeredText = object.name || object.username
          return { triggeredText }
        }

        let matchDestructor = (match) => {
          let [ entire, trigger, id ] = match
          return { entire, trigger, id }
        }

        let wrapper = document.createElement('p')
        if (message) {
          this.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
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
