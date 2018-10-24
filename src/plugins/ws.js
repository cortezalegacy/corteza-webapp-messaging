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
    window.$ws = ws
  },
}

function Websocket ({ eventbus }) {
  this.active = false
  this.conn = null
  this.queue = []
  this.$bus = eventbus
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
        this.$bus.$emit(`$ws.${type}`, payload[type])
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

  close () {
    this.conn.close()
  },

  converters: {
    message (m) {
      return new Message(m)
    },
  },
})
