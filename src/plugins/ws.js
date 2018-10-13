import ReconnectingWebSocket from 'reconnecting-websocket'
import { Message } from '@/types'

export default {
  install (Vue) {
    const ws = new Websocket()
    Vue.prototype.$ws = ws
  },
}

function Websocket () {
  this.active = false
  this.conn = null
  this.listeners = {}
  this.queue = []
}

Websocket.prototype = Object.assign(Websocket.prototype, {
  connected () {
    return this.active && this.conn !== null
  },

  connect () {
    const baseUrl = window.CrustConfig.sam.baseUrl || 'https://sam.api.latest.rustbucket.io'

    console.log('Connecting to Crust Messaging Websocket')
    const url = baseUrl.replace(/^http/, 'ws') + '/websocket/'

    this.conn = new ReconnectingWebSocket(url)
    this.conn.debug = true
    this.conn.reconnectInterval = 3000

    document.addEventListener('beforeunload', () => {
      // Disconnect when we navigate away/close window
      this.close()
    })

    this.conn.addEventListener('open', () => {
      this.active = true

      if (this.queue.length > 0) {
        console.debug('', 'Draining message queue', { length: this.queue.length })

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

      for (const type in payload) {
        if (this.listeners[type] !== undefined) {
          let ptr = this.listeners[type].length
          while (ptr--) {
            this.listeners[type][ptr].handler(payload[type])

            if (this.listeners[type][ptr].once) {
              this.listeners[type].splice(ptr, 1)
            }
          }
        } else if (type === 'error') {
          console.error('Received an error through websocket:', payload[type].m || 'No error message')
        } else {
          console.warn('Unhandled message type received', type, payload[type])
        }
      }
    })
  },

  async send (msg) {
    return new Promise((resolve) => {
      if (this.connected()) {
        this.conn.send(msg)
      } else {
        console.count('Offline, add message to queue')
        this.queue.push(msg)
      }

      resolve()
    })
  },

  async getChannels () {
    return this.send(JSON.stringify({ channels: {} }))
  },

  async createChannel (ch) {
    return this.send(JSON.stringify({ createChannel: ch }))
  },

  async updateChannel (ch) {
    // @todo merge these two into one function
    return this.send(JSON.stringify({ updateChannel: ch }))
  },

  async deleteChannel (id) {
    return this.send(JSON.stringify({ deleteChannel: { id } }))
  },

  async sendMessage (channelID, message) {
    return this.send(JSON.stringify({ createMessage: { channelID, message } }))
  },

  async exec (channelID, command, params, input) {
    return this.send(JSON.stringify({ exec: { channelID, command, params, input } }))
  },

  async getMessages (channelID, untilId, fromId) {
    return this.send(JSON.stringify({ messages: { channelID, untilId, fromId } }))
  },

  async newMessages (channelID, fromId) {
    return this.send(JSON.stringify({ messages: { channelID, fromId } }))
  },

  async oldMessages (channelID, untilId) {
    return this.send(JSON.stringify({ messages: { channelID, untilId } }))
  },

  async users () {
    return this.send(JSON.stringify({ getUsers: {} }))
  },

  subscribe (type, handler, once = false) {
    if (this.listeners[type] === undefined) {
      this.listeners[type] = []
    }

    this.listeners[type].push({
      handler: handler,
      once: once,
    })
  },

  once (type, handler) {
    this.subscribe(type, handler, true)
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
