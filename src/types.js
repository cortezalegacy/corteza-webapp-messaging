export function Channel (c) {
  if (!c) {
    return
  }

  this.ID = c.ID
  this.name = c.name
  this.topic = c.topic
  this.type = c.type
  this.lastMessageID = c.lastMessageID
  // this.members = c.members
}

export function Message (m) {
  if (!m) {
    return
  }

  this.ID = m.ID
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

  this.ID = a.ID
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

  this.ID = u.ID
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
