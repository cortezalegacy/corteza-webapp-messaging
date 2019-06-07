import GphApiClient from 'giphy-js-sdk-core'
import Provider from './index'

export class Gif {
  constructor ({ id, previewUrl, url, from, meta = {} }) {
    this.id = id
    this.previewUrl = previewUrl
    this.url = url
    this.from = from
    this.meta = meta
  }
}

export default class Giphy extends Provider {
  constructor ({ apiKey }) {
    super()
    this.apiKey = apiKey
    this.connected = false
  }

  async connect () {
    return new Promise((resolve, reject) => {
      if (this.connected) resolve(true)

      this.client = GphApiClient(this.apiKey)
      this.connected = true
      resolve(true)
    })
  }

  async disconnect () {
    return new Promise((resolve, reject) => {
      this.client = undefined
      this.connected = false
      resolve(true)
    })
  }

  async destroy () {
    if (this.client) {
      await this.disconnect()
    }

    return new Promise((resolve, reject) => {
      this.client = undefined
      resolve(true)
    })
  }

  async get ({ query: q, limit = 10, offset = 0 }) {
    return new Promise((resolve, reject) => {
      this.client[q ? 'search' : 'trending']('gifs', { q, limit, offset }).then(({ data }) => {
        resolve(
          data.map(({ id, images: { preview_gif: preview, original } }) => new Gif({
            id,
            previewUrl: preview.url,
            url: original.url,
            from: this.constructor.name,
            meta: { height: `${preview.height}px`, width: `${preview.width}px` },
          }))
        )
      }).catch((e) => reject(e))
    })
  }
}
