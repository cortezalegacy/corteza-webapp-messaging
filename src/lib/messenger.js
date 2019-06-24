// Helps fetch & process messages; storage done by caller

import { Message } from '@/types'

const messagesProcess = function (uGetter, messages = []) {
  // Append actual user & convert to internal object
  // return messages.map((m) => new Message({ ...m, user: uGetter(m.userID) }))
  return messages.map((m) => new Message(m))
}

// Load & process messages; messages available on promise resolve
const messagesLoad = async function (api, uGetter, opts = {}) {
  return new Promise((resolve, reject) => {
    // If threadID set, then fetch replies.
    if (opts.threadID) {
      api.searchMessages({ channelID: opts.channelID, threadID: opts.threadID }).then((messages) => {
        resolve(messagesProcess(uGetter, messages))
      })
    } else {
      api.searchMessages(opts).then((messages) => {
        resolve(messagesProcess(uGetter, messages))
      })
    }
  })
}

// Load & process thread messages; messages available on promise resolve
const messagesThreadLoad = async function (api, uGetter, opts = {}) {
  return new Promise((resolve, reject) => {
    api.searchThreads(opts).then((messages) => {
      resolve(messagesProcess(uGetter, messages))
    })
  })
}

export { messagesProcess, messagesLoad, messagesThreadLoad }
