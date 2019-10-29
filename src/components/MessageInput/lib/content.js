// Provides content related helpers, such as is content empty.

/**
 * Helper to determine if given content is empty or not.
 * @param {Object} content A JSON object provided by tiptap
 * @returns {Boolean}
 */
export function contentEmpty ({ content } = {}) {
  // Check if any nested node has any content
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
