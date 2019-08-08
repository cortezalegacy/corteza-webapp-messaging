const fuzzysort = require('fuzzysort')

export class Channel {
  constructor (c) {
    this.canUpdate = true

    if (!c) {
      this.members = []
      this.unread = {}
      return
    }

    this.channelID = c.channelID
    this.name = c.name
    this.topic = c.topic
    this.type = c.type
    this.membershipPolicy = c.membershipPolicy
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
    this.canChangeMembershipPolicy = !!c.canChangeMembershipPolicy
    this.canUpdate = !!c.canUpdate
    this.canArchive = !!c.canArchive
    this.canDelete = !!c.canDelete

    // only to pass values along to unread store, do not use it directly
    this.unread = c.unread

    this.members = c.members || [] // []string
  }

  fuzzyKey () {
    return fuzzysort.prepare(this.name || this.channelID || '')
  }

  isMember (userID) {
    return this.members.indexOf(userID) !== -1
  }

  isFeatured () {
    return (this.membershipPolicy === 'featured')
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
