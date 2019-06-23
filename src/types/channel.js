const fuzzysort = require('fuzzysort')

class ChannelUnread {
  constructor ({ lastMessageID, count } = {}) {
    this.lastMessageID = lastMessageID || null
    this.count = count || 0
  }
}

export class Channel {
  constructor (c) {
    this.canUpdate = true

    if (!c) {
      this.members = []
      this.unread = new ChannelUnread()
      return
    }

    this.channelID = c.channelID
    this.name = c.name
    this.topic = c.topic
    this.type = c.type
    this.membershipFlag = c.membershipFlag
    this.createdAt = c.createdAt
    this.updatedAt = c.updatedAt || null
    this.deletedAt = c.deletedAt || null
    this.archivedAt = c.archivedAt || null

    this.canJoin = !!c.canJoin
    this.canPart = !!c.canPart
    this.canObserve = !!c.canObserve
    this.canSendMessages = !!c.canSendMessages
    this.canDeleteMessages = !!c.canDeleteMessages
    this.canChangeMembers = !!c.canChangeMembers
    this.canUpdate = !!c.canUpdate
    this.canArchive = !!c.canArchive
    this.canDelete = !!c.canDelete

    this.unread = new ChannelUnread(c.unread)

    this.members = c.members || [] // []string
  }

  fuzzyKey () {
    return fuzzysort.prepare(this.name || this.channelID || '')
  }

  isMember (userID) {
    return this.members.indexOf(userID) !== -1
  }

  removeMember (user) {
    const ID = (user || {}).userID || user
    this.members = this.members.filter(m => m !== ID)
  }

  isDirectMessage () {
    return this.type === 'group' && this.name === '' && this.members.length === 2
  }

  isPinned () {
    return this.membershipFlag === 'pinned'
  }

  isGroup () {
    return this.type === 'group'
  }

  isPrivate () {
    return this.type === 'private'
  }

  isPublic () {
    return this.type === 'public'
  }

  isValid () {
    return !this.deletedAt && !this.archivedAt
  }
}
