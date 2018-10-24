import ReconnectingWebSocket from 'reconnecting-websocket'
import { Message } from '@/types'

export default {
  install (Vue) {
    const ws = new Websocket()
    Vue.prototype.$ws = ws
    window.$ws = ws
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

    console.debug('Connecting to Crust Messaging Websocket')
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
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg)
    }

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
    return this.send({ channels: {} })
  },

  async sendMessage (channelID, message) {
    return this.send({ createMessage: { channelID, message } })
  },

  async updateMessage (messageID, message) {
    return this.send({ updateMessage: { messageID, message } })
  },

  async deleteMessage (messageID) {
    return this.send({ deleteMessage: { messageID } })
  },

  async sendReply (replyTo, message) {
    return this.send({ createMessage: { replyTo, message } })
  },

  async exec (channelID, command, params, input) {
    return this.send({ exec: { channelID, command, params, input } })
  },

  async getMessages (channelID, untilID, fromID) {
    return this.send({ messages: { channelID, untilID, fromID } })
  },

  async getReplies (repliesTo) {
    return this.send({ messages: { repliesTo } })
  },

  async newerMessages (channelID, firstID) {
    return this.send({ messages: { channelID, firstID } })
  },

  async olderMessages (channelID, lastID) {
    return this.send({ messages: { channelID, lastID } })
  },

  async recordChannelView (channelID, lastMessageID) {
    return this.send({ recordChannelView: { channelID, lastMessageID } })
  },

  async users () {
    return this.send({ getUsers: {} })
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
