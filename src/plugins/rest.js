import axios from 'axios'
import { Message, Channel, Member } from '@/types'

export default {
  install (Vue, store) {
    const JSONbig = require('json-bigint')({ 'storeAsString': true })

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
        return window.CrustConfig.sam.baseUrl || 'https://sam.api.latest.rustbucket.io'
      },

      api () {
        return axios.create({
          transformResponse: [function (data) {
            // Do whatever you want to transform the data
            return JSONbig.parse(data)
          }],
          withCredentials: true,
          baseURL: this.baseURL(),
          headers: {
            'Content-Type': 'application/json',
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

      async updateChannel (ch) {
        return new Promise((resolve, reject) => {
          this.api().put(
            `/channels/${ch.ID}`,
            { topic: ch.topic, name: ch.name, type: ch.type }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async createChannel (ch) {
        return new Promise((resolve, reject) => {
          this.api().post(
            `/channels/`,
            { topic: ch.topic, name: ch.name, type: ch.type }
          ).then(stdChannelResolve(resolve, reject), stdRejection(reject))
        })
      },

      async sendDirectMessage (userId, message) {
        return new Promise((resolve, reject) => {
          this.api().post(
            `/users/${userId}/message`,
            { message }
          ).then(response => {
            if (response.data.error) {
              reject(response.data.error)
              return
            }

            const msg = response.data.response

            resolve(new Message(msg))
          }, stdRejection(reject))
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
    }
  },
}
