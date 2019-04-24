import axios from 'axios'
import { Message, Channel, Member } from '@/types'

export default {
  install (Vue) {
    const stdRejection = (reject) => (error) => {
      reject(error)
    }

    const stdChannelResolve = (resolve, reject) => (response) => {
      if (response.data.error) {
        reject(response.data.error)
      } else {
        resolve(new Channel(response.data.response))
      }
    }

    const stdMessageResolve = (resolve, reject) => (response) => {
      if (response.data.error) {
        reject(response.data.error)
      } else {
        resolve(new Message(response.data.response))
      }
    }

    const stdMemberResolve = (resolve, reject) => (response) => {
      if (response.data.error) {
        reject(response.data.error)
        return
      }

      let members = []

      response.data.response.forEach(m => {
        members.push(new Member(m))
      })

      resolve(members)
    }

    Vue.prototype.$rest = {
      baseURL () {
        return window.CrustMessagingAPI || 'https://messaging.api.latest.crust.tech'
      },

      api () {
        return axios.create({
          withCredentials: true,
          baseURL: this.baseURL(),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('auth.jwt'),
          },
        })
      },

      async getChannel (channelID) {
        return new Promise((resolve, reject) => {
          this.api().get(
            `/channels/${channelID}`
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async updateChannel ({ ID, name, topic, type }) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${ID}`,
            { topic, name, type }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async createChannel ({ ID, name, topic, type, members }) {
        return new Promise((resolve, reject) => {
          this.api().post(
            `/channels/`,
            { topic, name, type, members }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async updateChannelState (ID, state) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${ID}/state`,
            { state }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async getMembers (channelID) {
        return new Promise((resolve, reject) => {
          this.api().get(
            `/channels/${channelID}/members`
          ).then(stdMemberResolve(resolve, reject), stdRejection(reject))
        })
      },

      async addMember (channelID, userID) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${channelID}/members/${userID}`
          ).then(stdMemberResolve(resolve, reject), stdRejection(reject))
        })
      },

      async removeMember (channelID, userID) {
        return new Promise((resolve, reject) => {
          this.api().delete(
            `/channels/${channelID}/members/${userID}`
          ).then(response => {
            if (response.data.error) {
              reject(response.data.error)
              return
            }

            resolve(response.data.response)
          }, stdRejection(reject))
        })
      },

      async setMembershipFlag (channelID, flag) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${channelID}/flag`,
            { flag }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async removeMembershipFlag (channelID) {
        return new Promise((resolve, reject) => {
          this.api().delete(
            `/channels/${channelID}/flag`
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async sendMessage (channelID, message) {
        return new Promise((resolve, reject) => {
          this.api().post(
            `/channels/${channelID}/messages/`,
            { message }
          ).then(stdMessageResolve(resolve, reject), stdRejection(reject))
        })
      },

      async sendReply (channelID, replyTo, message) {
        return new Promise((resolve, reject) => {
          this.api().post(
            `/channels/${channelID}/messages/${replyTo}/replies`,
            { message }
          ).then(stdMessageResolve(resolve, reject), stdRejection(reject))
        })
      },

      async updateMessage (channelID, messageID, message) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${channelID}/messages/${messageID}`,
            { message }
          ).then(stdMessageResolve(resolve, reject), stdRejection(reject))
        })
      },

      async deleteMessage (channelID, messageID) {
        return new Promise((resolve, reject) => {
          this.api().delete(
            `/channels/${channelID}/messages/${messageID}`,
          ).then((response) => {
            if (response.data.error) {
              reject(response.data.error)
            } else {
              resolve()
            }
          }, stdRejection(reject))
        })
      },

      async markMessageAsRead ({ channelID, threadID = '0', lastReadMessageID = '0' }) {
        return new Promise((resolve, reject) => {
          this.api().get(
            `/channels/${channelID}/messages/mark-as-read`,
            { params: { threadID, lastReadMessageID } }
          ).then((response) => {
            if (response.data.error) {
              reject(response.data.error)
            } else {
              resolve(response.data.response)
            }
          }, stdRejection(reject))
        })
      },

      async bookmarkMessage (channelID, messageID, remove = false) {
        return this.flag({ channelID, messageID, type: 'bookmark', remove })
      },

      async pinMessage (channelID, messageID, remove = false) {
        return this.flag({ channelID, messageID, type: 'pin', remove })
      },

      async reactionToMessage (channelID, messageID, reaction, remove = false) {
        return this.flag({ channelID, messageID, type: 'reaction', reaction, remove })
      },

      async flag ({ channelID, messageID, type, reaction = null, remove = false }) {
        if (type === 'reaction') {
          type += `/${reaction}`
        }

        return new Promise((resolve, reject) => {
          this.api().request({
            method: remove ? 'DELETE' : 'POST',
            url: `/channels/${channelID}/messages/${messageID}/${type}`,
          }).then((response) => {
            if (response.data.error) {
              reject(response.data.error)
            } else {
              resolve()
            }
          }, stdRejection(reject))
        })
      },

      async searchMessages (query, { inChannel, fromUser, firstID, lastID } = {}) {
        return new Promise((resolve, reject) => {
          this.api().get(
            `/search/messages`,
            { params: { query, inChannel, fromUser, firstID, lastID } }
          ).then((r) => {
            if (r.data.error) {
              reject(r.data.error)
            } else {
              resolve(r.data.response.map(message => new Message(message)))
            }
          }, stdRejection(reject))
        })
      },
    }
  },
}
