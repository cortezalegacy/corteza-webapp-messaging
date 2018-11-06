import EmojiConvertor from 'emoji-js'

const emoji = new EmojiConvertor()

export default (str) => emoji.replace_emoticons(emoji.replace_colons(str))
