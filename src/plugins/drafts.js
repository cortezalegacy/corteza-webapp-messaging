function makeKey ({ channelID = '', messageID = '' }) {
  if (!this.prefix || (!channelID && !messageID)) {
    throw new Error('draft.key.invalid')
  }

  return `${this.prefix}.${messageID || channelID}`
}

function get (dest = {}) {
  const draft = this.api.getItem(this.makeKey(dest))
  if (!draft) {
    return draft
  }

  return JSON.parse(draft)
}

function remove (dest = {}) {
  return this.api.removeItem(this.makeKey(dest))
}

function set (dest = {}, value) {
  this.api.setItem(this.makeKey(dest), JSON.stringify(value))
}

export {
  makeKey,
  get,
  remove,
  set,
}

export default {
  install (Vue, { api = window.localStorage, prefix = 'draft' } = {}) {
    Vue.prototype.$drafts = {
      api,
      prefix,

      makeKey,
      get,
      remove,
      set,
    }
  },
}
