import EmojiConvertor from 'emoji-js'

const emojiREMatch = new RegExp('<span class="([^"]+?)"( style="([^"]+?)" data-codepoints="([^"]+?)")?>(.*?)</span>', '')
const emojiRESplit = new RegExp('(<span class="emoji[^"]+"(?: style="[^"]+" data-codepoints="[^"]+")?>.*?</span>)', 'g')

const emoji = new EmojiConvertor()

// Changing settings here can (and most likely will) result in broken
// vdomifyEmojis handler
emoji.text_mode = false
emoji.include_tite = true
emoji.wrap_native = true
emoji.use_sheet = false // does not work => offset in sprites

emoji.img_sets.apple.path = 'https://unicodey.com/emoji-data/img-apple-64/'

// emoji.replace_mode = 'css' // enable to see how it looks with sheet emojis
// emoji.replace_mode = 'img' // enable to see how it looks with img emojis

// console.debug('Emojis', {
//   replaceMode: emoji.replace_mode,
//   supportsCSS: emoji.supports_css,
// })

export function textToEmoji (str) {
  return emoji.replace_emoticons(emoji.replace_colons(str))
}

// Walk through vtree and convert inserted HTML into vdom
export function vdomifyEmojis (vtree, createElement) {
  for (let c = 0; c < vtree.length; c++) {
    if (vtree[c].children !== undefined && vtree[c].children.length > 0) {
      vtree[c].children = vdomifyEmojis(vtree[c].children, createElement)
      continue
    }

    if (vtree[c].text === undefined || vtree[c].text.length <= 1) {
      // Node empty or too short to bother
      continue
    }

    const converted = textToEmoji(vtree[c].text)
    if (vtree[c].text !== converted) {
      // Text changed, assume emojis
      // vtree[c].text = undefined
      const nodes = []
      let split = converted.split(emojiRESplit)
      for (let s = 0; s < split.length; s++) {
        if (s % 2 === 0) {
          if (split[s].length > 0) {
            nodes.push(split[s])
          }
        } else {
          let [ , classes,, style, dataCodepoints, nativeEmoji, ] = split[s].match(emojiREMatch)
          nodes.push(createElement(
            'span',
            { attrs: { class: classes, style, 'data-codepoints': dataCodepoints } },
            nativeEmoji))
        }
      }

      vtree[c] = createElement('span', nodes)
    }
  }

  return vtree
}
