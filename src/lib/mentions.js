export const mentionSplitRE = new RegExp('(<[@#]\\d+\\s?[^>]*?>)')
export const mentionRE = new RegExp('<([@#])(\\d+)((?:\\s)([^>]+))?>')

// Parses given string and replaces mentions of users
// and channels with plain text
export function cleanMentions (string, users = [], channels = []) {
  const split = string.split(mentionSplitRE, -1)

  const userLabel = (ID, label) => label || users.find(u => u.userID === ID || {}).label || ID
  const chanLabel = (ID, label) => '#' + (label || channels.find(c => c.channelID === ID || {}).name || ID)

  for (let s = 0; s < split.length; s++) {
    // It's a split, ignore odds.
    if (s % 2 !== 1) continue

    const [, char, ID, , label] = mentionRE.exec(split[s])
    split[s] = char === '#' ? chanLabel(ID, label) : userLabel(ID, label)
  }

  return split.join('')
}
