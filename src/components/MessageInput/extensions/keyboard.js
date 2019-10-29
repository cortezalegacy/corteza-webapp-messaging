import { Extension } from 'tiptap'

/**
 * Wrapper class to provide a nicer way to register keyboard listeners.
 * I should be used for things like: on enter -> submit; on arrow up -> edit last, ...
 * Provide an object of { event: action } when initializing this extension.
 * See https://prosemirror.net/docs/ref/#keymap for details.
 */
export default class Keyboard extends Extension {
  get name () {
    return 'keyboard'
  }

  get defaultOptions () {
    return {
      map: {},
    }
  }

  keys () {
    return this.options.map
  }

  get plugins () {
    return []
  }
}
