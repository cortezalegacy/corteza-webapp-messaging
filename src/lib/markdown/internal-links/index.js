'use strict'

const internalLinkSplitRE = new RegExp(`(<[@#]\\d+\\s?[^>]*?>)`)
const internalLinkRE = new RegExp(`<([@#])(\\d+)((?:\\s)([^>]+))?>`)

export default (md, setup) => {
  md.core.ruler.push('internalLink', parser.bind(md))
}

function parser (state) {
  let blockTokens = state.tokens
  let autolinkLevel = 0

  for (let j = 0; j < blockTokens.length; j++) {
    if (blockTokens[j].type !== 'inline') { continue }
    let tokens = blockTokens[j].children

    // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match
    for (let i = tokens.length - 1; i >= 0; i--) {
      let token = tokens[i]

      if (token.type === 'text' && autolinkLevel === 0 && internalLinkRE.test(token.content)) {
        // replace current node
        blockTokens[j].children = tokens = this.utils.arrayReplaceAt(
          tokens, i, splitTextToken(token.content, token.level, state.Token)
        )
      }
    }
  }

  return false
}

function splitTextToken (text, level, Token) {
  let nodes = []
  let t

  text.split(internalLinkSplitRE).forEach(text => {
    const match = internalLinkRE.exec(text)
    if (match === null) {
      t = new Token('text', '', 0)
      t.content = text
      nodes.push(t)
    } else {
      const [ , denotationChar, ID, , label ] = match
      switch (denotationChar) {
        case '#':
          t = new Token('internalLink', 'channel-link', 0)
          break
        case '@':
          t = new Token('internalLink', 'user-link', 0)
          break
      }

      t.attrPush([ 'ID', ID ])

      if (label) {
        t.attrPush([ 'label', label ])
      }

      nodes.push(t)
    }
  })

  return nodes
}
