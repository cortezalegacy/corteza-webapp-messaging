import ReconnectingWebSocket from 'reconnecting-websocket'
import { Message } from '@/types'

export default {
  install (Vue, { eventbus }) {
    // Pass event bus to websocket handler so it can broadcast received messages to concerned parties.
    if (eventbus === undefined || eventbus.$emit === undefined) {
      throw Error('Expecting eventbus to be passed as an option to websocket plugin')
    }

    const ws = new Websocket({ eventbus })

    Vue.prototype.$ws = ws

    // Expose $ws so we can access it from
    // the browser console
    // @todo disable this when not in debug mode
    window.$ws = ws
  },
}

function Websocket ({ eventbus }) {
  this.active = false
  this.conn = null
  this.echoMessages = false
  this.queue = []
  this.$bus = eventbus
}

Websocket.prototype = Object.assign(Websocket.prototype, {
  connected () {
    return this.active
  },

  connect () {
    // check if already connected
    if (this.connected()) return

    const url = this.guessBaseUrl(window.MessagingAPI) + '/websocket/?jwt=' + localStorage.getItem('auth.jwt')

    this.conn = new ReconnectingWebSocket(url)
    this.conn.debug = true
    this.conn.reconnectInterval = 3000

    document.addEventListener('beforeunload', () => {
      // Disconnect when we navigate away/close window
      this.close()
    })

    this.conn.addEventListener('open', () => {
      this.$bus.$emit(`$ws.open`, true)

      console.debug('Connected to Crust Messaging Websocket')
      this.active = true

      if (this.queue.length > 0) {
        console.debug(`Connected, draining message queue (l=${this.queue.length})`)

        while (this.active && this.queue.length > 0) {
          const msg = this.queue.shift()

          if (msg) {
            this.conn.send(msg)
          }
        }
      }
    })

    this.conn.addEventListener('close', (ev) => {
      this.active = false
    })

    this.conn.addEventListener('message', (ev) => {
      const payload = JSON.parse(ev.data)

      if (this.echoMessages) {
        console.debug('$ws.@message', payload)
      }

      for (const type in payload) {
        this.$bus.$emit(`$ws.${type}`, payload[type])
      }
    })
  },

  guessBaseUrl (messagingAPI) {
    if (messagingAPI.substring(0, 2) === '//') {
      // No schema but with hostname
      return location.protocol.replace(/^http/, 'ws') + messagingAPI
    }
    if (messagingAPI.substring(0, 1) === '/') {
      // No schema, no hostname,..
      return location.protocol.replace(/^http/, 'ws') + '//' + location.host + messagingAPI
    }

    // Schema & hostname present
    return messagingAPI.replace(/^http/, 'ws')
  },

  close () {
    this.conn.close()
  },

  converters: {
    message (m) {
      return new Message(m)
    },
  },
})
