export function Channel (c) {
  c = c || {}

  this.ID = c.ID || c.id || undefined // cover both cases (BC)
  this.name = c.name
  this.topic = c.topic
  this.type = c.type
  this.createdAt = c.createdAt
  this.updatedAt = c.updatedAt || null
  this.deletedAt = c.deletedAt || null
  this.archivedAt = c.archivedAt || null

  this.members = c.members || [] // []string
}

export function Message (m) {
  if (!m) {
    return
  }

  this.ID = m.ID || m.id // cover both cases (BC)
  this.message = m.message
  this.type = m.type
  this.channelID = m.channelID
  this.replyTo = m.replyTo || 0
  this.replies = m.replies || 0
  this.createdAt = m.createdAt
  this.updatedAt = m.updatedAt || null
  this.deletedAt = m.deletedAt || null

  this.user = new User(m.user)
  this.attachment = m.att ? new Attachment(m.att) : null
}

Message.prototype.canEdit = function (user) {
  return this.user.ID === user.ID
}

Message.prototype.canDelete = function (user) {
  return this.user.ID === user.ID
}

export function Attachment (a) {
  this.ID = a.ID || a.id // cover both cases (BC)
  this.userID = a.userID
  this.name = a.name
  this.meta = a.meta
  this.url = a.url
  this.previewUrl = a.previewUrl
  this.downloadUrl = this.url + '?download=1'
}

export function User (u) {
  if (!u) {
    return {}
  }
  
  this.ID = u.ID || u.id // cover both cases (BC)
  this.username = u.username
  this.handle = u.handle
  this.name = u.name
  this.connections = u.connections || 0
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
