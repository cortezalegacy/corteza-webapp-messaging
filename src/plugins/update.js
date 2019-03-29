export default function (Vue, store) {
  const jwt = Vue.$auth.JWT
  Vue.$system.baseURL = window.CrustSystemAPI
  Vue.$system.setJWT(jwt)

  Vue.$messaging.baseURL = window.CrustMessagingAPI
  Vue.$messaging.setJWT(jwt)

  // Reconnect sockets
  if (Vue.$ws.connected()) {
    Vue.$ws.close()
  }
  Vue.$ws.connect()
}
