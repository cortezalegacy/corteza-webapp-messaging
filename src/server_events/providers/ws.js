import Provider from '.'
import ReconnectingWebSocket from 'reconnecting-websocket'

function wsURL (api, jwt) {
  const finalize = (api, jwt) => `${api}/websocket/?jwt=${jwt}`

  if (api.substring(0, 2) === '//') {
    // No schema but with hostname
    return finalize(location.protocol.replace(/^http/, 'ws') + api, jwt)
  }
  if (api.substring(0, 1) === '/') {
    // No schema, no hostname,..
    return finalize(location.protocol.replace(/^http/, 'ws') + '//' + location.host + api, jwt)
  }

  // Schema & hostname present
  return finalize(api.replace(/^http/, 'ws'), jwt)
}

export default class WS extends Provider {
  constructor ({ api, jwt, eventbus, debug = true, reconnectInterval = 3000 }) {
    super()

    if (eventbus === undefined || eventbus.$emit === undefined) {
      throw Error('eventbus.invalid')
    }

    this.connection = null
    this.active = false
    this.api = api
    this.jwt = jwt
    this.debug = debug
    this.reconnectInterval = reconnectInterval
    this.$bus = eventbus
  }

  get connected () {
    return this.active
  }

  connect () {
    if (this.connected) {
      return this
    }

    // init connection
    const url = wsURL(this.api, this.jwt)
    const opts = {
      debug: this.debug,
      maxReconnectionDelay: this.reconnectInterval,
    }
    this.connection = new ReconnectingWebSocket(url, [], opts)

    this.connection.addEventListener('open', () => {
      this.$bus.$emit(`$ServerEvents.open`, {})
      this.active = true
    })

    this.connection.addEventListener('close', (ev) => {
      this.$bus.$emit(`$ServerEvents.close`, {})
      this.active = false
    })

    this.connection.addEventListener('message', (ev) => {
      const payload = JSON.parse(ev.data)
      for (const type in payload) {
        this.$bus.$emit(`$ServerEvents.${type}`, payload[type])
      }
    })

    return this
  }

  disconnect () {
    this.connection.close()
  }

  static async canConnect (api, jwt) {
    return new Promise((resolve, reject) => {
      try {
        const s = new WebSocket(wsURL(api, jwt))
        s.addEventListener('open', (e) => {
          s.close()
          resolve()
        })
        s.addEventListener('error', (e) => {
          reject(new Error('ws.unavailable'))
        })
      } catch (e) {
        reject(new Error('ws.unavailable'))
      }
    })
  }
}
