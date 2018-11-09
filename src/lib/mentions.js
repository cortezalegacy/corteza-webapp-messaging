export const mentionSplitRE = new RegExp(`(<[@#]\\d+\\s?[^>]*?>)`)
export const mentionRE = new RegExp(`<([@#])(\\d+)((?:\\s)([^>]+))?>`)

// Parses given string and replaces mentions of users
// and channels with plain text
export function cleanMentions (string, users = [], channels = []) {
  let split = string.split(mentionSplitRE, -1)

  const userLabel = (ID, label) => label || (users.find(u => u.ID === ID) || {}).label || ID
  const chanLabel = (ID, label) => '#' + (label || (channels.find(c => c.ID === ID) || {}).name || ID)

  for (let s = 0; s < split.length; s++) {
    // It's a split, ignore odds.
    if (s % 2 !== 1) continue

    const [ , char, ID, , label ] = mentionRE.exec(split[s])
    split[s] = char === '#' ? chanLabel(ID, label) : userLabel(ID, label)
  }

  return split.join('')
}

// Converts  given string and replaces mentions with HTML code understood by
// Quill editor.
export function enrichMentions (string, users = [], channels = []) {
  const html = (char, ID, label) =>
    '<span class="mention" data-denotation-char="' + char + '" data-id="' + ID + '" data-value="' + label + '">' +
    '<span contenteditable="false"><span class="ql-mention-denotation-char">' + char + '</span>' + label + '</span>' +
    '</span>'

  let split = string.split(mentionSplitRE, -1)

  for (let s = 0; s < split.length; s++) {
    // It's a split, ignore odds.
    if (s % 2 !== 1) continue

    const [ , char, ID, , label ] = mentionRE.exec(split[s])
    split[s] = html(char, ID, label)
  }

  return split.join('')
}
