// Helps fetch & process messages; storage done by caller

import { Message } from '@/types'

const messagesProcess = function (uGetter, messages = []) {
  // Append actual user & convert to internal object
  return messages.map((m) => new Message({ ...m, user: uGetter(m.userID) }))
}

// Load & process messages; messages available on promise resolve
const messagesLoad = async function (api, uGetter, opts = {}) {
  console.debug('messanger.loading', { opts })
  return new Promise((resolve, reject) => {
    // If threadID set, then fetch replies.
    if (opts.threadID) {
      api.searchMessages({ channelID: opts.channelID, threadID: opts.threadID }).then((messages) => {
        console.debug('messanger.completed', { opts })
        resolve(messagesProcess(uGetter, messages))
      })
    } else {
      // Remove undefined params
      let params = { channelID: opts.channelID, toMessageID: opts.toMessageID, fromMessageID: opts.fromMessageID }
      Object.keys(params).forEach(key => !params[key] ? delete params[key] : '')

      api.searchMessages(params).then((messages) => {
        console.debug('messanger.completed', { opts })
        resolve(messagesProcess(uGetter, messages))
      })
    }
  })
}

// Load & process thread messages; messages available on promise resolve
const messagesThreadLoad = async function (api, uGetter, opts = {}) {
  console.debug('messanger.thread.loading', { opts })
  return new Promise((resolve, reject) => {
    let params = { channelID: opts.channelID }
    Object.keys(params).forEach(key => !params[key] ? delete params[key] : '')

    api.searchThreads(params).then((messages) => {
      console.debug('messanger.thread.completed', { opts })
      resolve(messagesProcess(uGetter, messages))
    })
  })
}

export { messagesProcess, messagesLoad, messagesThreadLoad }
