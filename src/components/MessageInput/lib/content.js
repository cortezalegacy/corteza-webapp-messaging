// Provides content related helpers, such as content stringification, parsing, ...

/**
 * Helper to determine if given content is empty or not.
 * @param {Object} content A JSON object provided by tiptap
 * @returns {Boolean}
 */
export function contentEmpty (document) {
  if (!document) {
    return true
  }
  // Check if any nested node has any content
  const { content } = document
  return !content || !content || !content.reduce((acc, cur) => acc || !!cur.content, false)
}

/**
 * Helper to determine draft object. Discard old Delta objects
 * @param {Object} draft Draft
 */
export function getDraft (draft) {
  // Discard old Delta objects
  if (!draft || draft.ops) {
    return null
  }

  return draft
}

// Mention regexps
export const mentionSplitRE = new RegExp(`(<[@#]\\d+\\s?[^>]*?>)`)
export const mentionRE = new RegExp(`<([@#])(\\d+)((?:\\s)([^>]+))?>`)

/**
 * Helper function to export given document to plain text
 * @param {Document} doc Document object, representing current message
 * @returns {String}
 */
export function stringifyDocument (doc = {}) {
  if (!doc) {
    return
  }

  let out = ``
  for (const c of doc.content || []) {
    if (c.type === 'paragraph') {
      out += stringifyLine(c) + '\n'
    }
  }

  return out.trim()
}

/**
 * Helper function to stringify the given Document. Handles mentions.
 * @param {Array} content Doc's content nodes
 * @returns {String}
 * @private
 */
function stringifyLine ({ content = [] }) {
  let line = ``

  for (const { type, ...rest } of content) {
    if (type === 'text') {
      line += rest.text
    } else {
      line += `<${type.split('-').pop()}${rest.attrs.id}>`
    }
  }

  return line.trim()
}

/**
 * Helper function to parse a given string to the Document object
 * @param {String} message Message to parse
 * @returns {Document}
 */
export function parseDocument (message = '') {
  let lines = message
    .trim()
    .split('\n')

  const content = []
  for (const line of lines) {
    const cc = parseLine(line)
    // If content is empty, it can be omitted
    if (cc.length) {
      content.push({
        type: 'paragraph',
        content: cc,
      })
    } else {
      content.push({
        type: 'paragraph',
      })
    }
  }
  return {
    type: 'doc',
    content,
  }
}

/**
 * Helper function to parse a given line to a content node
 * @param {String} line Line
 * @returns {Array}
 * @private
 */
function parseLine (line = '') {
  const content = []
  const chunks = line.split(mentionSplitRE, -1)

  for (let i = 0; i < chunks.length; i++) {
    // Since we are splitting, odd chunks represent plain text
    if (i % 2 !== 1) {
      if (chunks[i]) {
        content.push({ type: 'text', text: chunks[i] })
      }
    } else {
      const [ , denotationChar, id, , label ] = mentionRE.exec(chunks[i])
      content.push({
        type: `mention-${denotationChar}`,
        attrs: {
          id,
          label,
        },
      })
    }
  }

  return content
}
