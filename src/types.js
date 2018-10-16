export function Channel (c) {
  c = c || {}

  this.ID = c.ID || c.id || undefined // cover both cases (BC)
  this.name = c.name
  this.topic = c.topic
  this.type = c.type
  this.createdAt = c.createdAt
  this.updatedAt = c.updatedAt
  this.deletedAt = c.deletedAt
  this.archivedAt = c.archivedAt

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
  this.replyTo = m.replyTo
  this.createdAt = m.createdAt

  this.attachment = null
  this.user = null

  if (m.att) {
    this.attachment = new Attachment(m.att)
  }

  if (m.user) {
    this.user = new User(m.user)
  }
}

export function Attachment (a) {
  if (!a) {
    return
  }

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
    return
  }

  this.ID = u.ID || u.id // cover both cases (BC)
  this.username = u.username
  this.handle = u.handle
  this.name = u.name
  this.connections = u.connections
}

export function Member (m) {
  if (!m) {
    return
  }

  this.user = new User(m.user)
  this.type = m.type
  this.channelID = m.channelID
  this.createdAt = m.createdAt
  this.updatedAt = m.updatedAt
}
