import { Mention as MentionBase } from 'tiptap-extensions'

/**
 * This is an adjustment to the original extension provided by tiptap.
 * Original extension is unable to match multiple types (channel, user, ...)
 * and unable to be registered multiple times.
 */
export default class Mention extends MentionBase {
  /**
   * Extensions are registered based on name, so this tweak fixes the above
   * mentioned problems.
   * @returns {String}
   */
  get name () {
    return `mention-${this.options.matcher.char}`
  }
}
