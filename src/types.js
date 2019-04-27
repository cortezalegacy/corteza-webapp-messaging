export class Channel {
  constructor (c) {
    this.canUpdate = true

    if (!c) {
      this.members = []
      return
    }

    this.ID = c.ID || c.id || undefined // cover both cases (BC)
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

    this.members = c.members || [] // []string
  }

  isMember (userID) {
    return this.members.indexOf(userID) !== -1
  }

  removeMember (user) {
    const ID = (user || {}).ID || user
    this.members = this.members.filter(m => m !== ID)
  }

  isDirectMessage () {
    return this.type === 'group' && this.members.length === 2
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

export class Message {
  constructor (m) {
    if (!m) {
      return
    }

    this.ID = m.ID || m.id // cover both cases (BC)
    this.message = m.message
    this.type = m.type
    this.channelID = m.channelID
    this.replyTo = m.replyTo || ''
    this.replies = m.replies || 0
    this.createdAt = m.createdAt
    this.updatedAt = m.updatedAt || null
    this.deletedAt = m.deletedAt || null

    this.isPinned = !!m.isPinned
    this.isBookmarked = !!m.isBookmarked
    this.reactions = (m.reactions || []).map(r => new MessageReaction(r))
    this.mentions = m.mentions || []

    this.canReply = !!m.canReply
    this.canEdit = !!m.canEdit
    this.canDelete = !!m.canDelete

    this.user = new User(m.user)
    this.attachment = m.att ? new Attachment(m.att) : null
  }

  isMentioned (userID) {
    return this.mentions.indexOf(userID) !== -1
  }

  addReaction ({ reaction, userID }) {
    const i = this.reactions.findIndex(r => r.reaction === reaction)

    if (i === -1) {
      this.reactions.push(new MessageReaction({ reaction, userIDs: [userID], count: 1 }))
    } else {
      let r = this.reactions[i]

      if (r.userIDs.indexOf(userID) === -1) {
        r.userIDs.push(userID)
        r.count = r.userIDs.length
      }
    }
  }

  removeReaction ({ reaction, userID }) {
    const i = this.reactions.findIndex(r => r.reaction === reaction)

    if (i !== -1) {
      let r = this.reactions[i]
      r.userIDs = r.userIDs.filter(ID => ID !== userID)
      r.count = r.userIDs.length
    }

    // Filter out all invalid reactions
    this.reactions = this.reactions.filter(r => r.count > 0)
  }
}

class MessageReaction {
  constructor ({ reaction, userIDs, count }) {
    this.reaction = reaction
    this.userIDs = userIDs
    this.count = count
  }
}

export function Attachment (a) {
  this.ID = a.ID || a.id // cover both cases (BC)
  this.userID = a.userID
  this.name = a.name
  this.meta = a.meta
  this.url = a.url
  this.previewUrl = a.previewUrl
  this.downloadUrl = a.url + '&download=1'
}

export class User {
  constructor (u) {
    u = u || {}

    this.ID = u.ID || u.id || u.userID || '' // cover both cases (BC)
    this.username = u.username || ''
    this.handle = u.handle || ''
    this.name = u.name || ''
    this.email = u.email || ''
    this.connections = u.connections || 0

    this.fts = (this.name + ' ' + this.username + ' ' + this.handle + ' ' + this.email + ' ' + this.ID).toLocaleLowerCase()
  }

  Match (q) {
    return this.fts.indexOf(q) > -1
  }

  SetConnections ({ value, delta }) {
    if (value !== undefined) {
      this.connections = value
      return true
    } else if (delta !== undefined) {
      this.connections += delta
      return true
    }
    return false
  }
}

export function Member (m) {
  if (!m) {
    return
  }

  this.user = new User(m.user)
  this.type = m.type
  this.channelID = m.channelID
  this.createdAt = m.createdAt || null
  this.updatedAt = m.updatedAt || null
}
