/**
 * Plugin allows access to external content providers such as giphy.
 * To add a new provider, you should create a class and extend the `Provider` (/api/media/index.js)
 * On plugin registration, specify what providers to use.
 */

/**
 * determines what provider to use, if one not specified.
 * @param {String} provider providers type or key
 * @param {Object} providers provider array
 */
const getProvider = ({ provider, providers }) => {
  if (!provider && Object.keys(providers).length > 1) {
    return false
  } else if (!provider) {
    provider = Object.keys(providers)[0]
  }

  if (!provider) {
    return false
  }
  return providers[provider]
}

export default {
  install (Vue, { providers = [] }) {
    let loaded = {}

    // Dynamic provider loading
    providers.map(({ type, key, params = {} }) => require([`../external/content/${type}.js`], ({ default: ProviderClass }) => {
      const provider = new ProviderClass(params)
      loaded[key || type] = provider
    }))

    Vue.prototype.$externalContent = {
      providers: loaded,

      async connect ({ provider } = {}) {
        return new Promise((resolve, reject) => {
          provider = getProvider({ provider, providers: this.providers })
          if (!provider) {
            reject(new Error('provider.notSpecified', Object.keys(this.providers)))
          }

          return provider.connect().then(resolve, reject)
        })
      },

      async disconnect ({ provider } = {}) {
        return new Promise((resolve, reject) => {
          provider = getProvider({ provider, providers: this.providers })
          if (!provider) {
            reject(new Error('provider.notSpecified', Object.keys(this.providers)))
          }

          return provider.disconnect().then(resolve, reject)
        })
      },

      async destroy ({ provider } = {}) {
        return new Promise((resolve, reject) => {
          provider = getProvider({ provider, providers: this.providers })
          if (!provider) {
            reject(new Error('provider.notSpecified', Object.keys(this.providers)))
          }

          return provider.destroy().then(resolve, reject)
        })
      },

      async get ({ provider, params = {} } = {}) {
        return new Promise((resolve, reject) => {
          provider = getProvider({ provider, providers: this.providers })
          if (!provider) {
            reject(new Error('provider.notSpecified', Object.keys(this.providers)))
          }

          provider.connect().then((connected) => {
            if (!connected) reject(new Error('provider.connectFailed'))
            return provider.get(params).then(resolve, reject)
          }).catch((e) => reject(e))
        })
      },
    }
  },
}
