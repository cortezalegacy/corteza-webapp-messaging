import { SSE, WS } from '../server_events'

// Available providers; priority determined by order
// @note move to config?
const providers = [
  { Client: WS },
  { Client: SSE },
]

export default {
  install (Vue, { eventbus }) {
    Vue.prototype.$ServerEvents = {
      client: null,

      connect (api, jwt) {
        this.determineClient(api, jwt)
          .then(({ Client }) => {
            this.client = (new Client({ api, jwt, eventbus })).connect()
          })
          .catch((e) => {
            eventbus.$emit('$ServerEvents.noClient')
          })
      },

      disconnect () {
        if (this.client) {
          this.client.disconnect()
        }
      },

      async determineClient (api, jwt) {
        for (let { Client } of providers) {
          try {
            await Client.canConnect(api, jwt)
            return { Client }
          } catch (e) {}
        }

        throw new Error('serverEvent.noClient')
      },
    }
  },
}
