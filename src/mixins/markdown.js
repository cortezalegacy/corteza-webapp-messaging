import hljs from 'highlight.js'
import 'highlight.js/styles/xcode.css'
import EmojiConvertor from 'emoji-js'

const emoji = new EmojiConvertor()

const md = require('markdown-it')({
  html: true,
  breaks: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (__) {}
    }

    return '' // use external default escaping
  },
})

const linkRenderer = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target')

  if (aIndex < 0) {
    // add new attribute
    tokens[idx].attrPush(['target', '_blank'])
  } else {
    // replace value of existing attr
    tokens[idx].attrs[aIndex][1] = '_blank'
  }

  // pass token to default renderer.
  return linkRenderer(tokens, idx, options, env, self)
}

const textRenderer = md.renderer.rules.text || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.text = function (tokens, idx, options, env, self) {
  return emoji.replace_emoticons(emoji.replace_colons(textRenderer(tokens, idx, options, env, self)))
}

export default {
  methods: {
    renderMarkdown (string) { return md.render(string) },
  },
}
