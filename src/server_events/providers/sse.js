import Provider from '.'
import ReconnectingEventSource from 'reconnecting-eventsource'

function sseURL (api, jwt) {
  return `${api}/sse/?jwt=${jwt}`
}

export default class SSE extends Provider {
  constructor ({ api, jwt, eventbus, reconnectInterval = 3000 }) {
    super()

    if (eventbus === undefined || eventbus.$emit === undefined) {
      throw Error('eventbus.invalid')
    }

    this.connection = null
    this.active = false
    this.api = api
    this.jwt = jwt
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

    const url = sseURL(this.api, this.jwt)
    const opts = {
      max_retry_time: this.reconnectInterval,
    }
    this.connection = new ReconnectingEventSource(url, opts)

    this.connection.onopen = () => {
      this.$bus.$emit(`$ServerEvents.open`, {})
      this.active = true
    }

    this.connection.onmessage = (ev) => {
      const payload = JSON.parse(ev.data)
      for (const type in payload) {
        this.$bus.$emit(`$ServerEvents.${type}`, payload[type])
      }
    }

    return this
  }

  disconnect () {
    this.connection.close()
    this.$bus.$emit(`$ServerEvents.close`, {})
    this.active = false
  }

  static async canConnect (api, jwt) {
    return new Promise((resolve, reject) => {
      try {
        const s = new EventSource(sseURL(api, jwt))
        s.onopen = () => {
          s.close()
          resolve()
        }
        s.onerror = () => {
          reject(new Error('sse.unavailable'))
        }
      } catch (e) {
        reject(new Error('sse.unavailable'))
      }
    })
  }
}
