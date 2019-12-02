export const activityTTL = 3000

/**
 * Defines an activity
 */
export class Activity {
  constructor (props = {}) {
    Object.assign(this, props)
    this.createdAt = (new Date()).getTime()
    this.update()
  }

  isStale (ttl = activityTTL) {
    const now = (new Date()).getTime()
    return now - ttl > this.updatedAt
  }

  update () {
    this.updatedAt = (new Date()).getTime()
    return this
  }

  /**
   * Provides a filter to find an activity from a set of activities
   * @param {String} userID Activity's owner
   * @param {String} channelID Activity's channel
   * @param {String} kind Activity kind
   * @returns {Function} Comparator
   */
  static activityFinder ({ userID, channelID, kind }) {
    return (a) => a.userID === userID && a.channelID === channelID && a.kind === kind
  }
}
