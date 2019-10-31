// Provides mention related helpers, such as fuzzy-search definitions
import fuzzysort from 'fuzzysort'
import { toNFD } from 'corteza-webapp-messaging/src/lib/normalizers'

// Specifies when a non prioritized match is considered good
const goodMatchThreshold = 0.35

// Provides a set of available mention types
export const mentionTypes = [
  { char: '@', type: 'user' },
  { char: '#', type: 'channel' },
]

/**
 * Helper function to calculate match score [0, 1] for a given key
 * @param {Object} target Key, on which to calculate match score
 * @param {Object} indexes Matching indexes
 * @returns {Number}
 */
export function fuzzyMatch ({ target, indexes }) {
  return indexes.length / target.length
}

// Default set of options for fuzzy search
export const fuzzyOptions = {
  threshold: -1000,
  allowTypo: true,
  keys: [
    'email',
    'name',
    'handle',
  ],

  scoreFn: (a) => {
    // Check only relavant matches
    const fltr = a.filter(mm => !!mm)
    if (!fltr.length) {
      return -1001
    }

    return fltr.sort((a, b) => fuzzyMatch(a) - fuzzyMatch(b)).pop()
  },
}

/**
 * A helper function to determine a subset of items, that match the specified criteria.
 * @param {Array} items A set of available items
 * @param {String} query Query string
 * @param {Array|undefined} priorities A set of items to prioritize. Omit if not needed
 * @param {Object|undefined} options Options to overwrite default fuzzy options
 * @returns {Array} A set of items that match the given criteria
 */
export function getMatches ({ items, query, priorities, options = {} }) {
  query = toNFD(query)

  // Prepare a set of items that match the given query
  if (query.length !== 0) {
    items = fuzzysort.go(query, items, { ...fuzzyOptions, ...options })
  } else {
    items = items.map(obj => ({ obj }))
  }

  // Update item set based on priorities
  const p = []
  const rest = []
  items.forEach(v => {
    if (priorities && priorities.has(v.obj.id)) {
      p.push(v)
    } else {
      rest.push(v)
    }
  })

  // Construct the final set. Include good non-prioritized matches.
  return rest.filter(({ score, obj }) => {
    if (!p.length) {
      return true
    }

    if (!score) {
      return false
    }
    return fuzzyMatch(score) > goodMatchThreshold
  }).concat(p).map(r => r.obj)
}
