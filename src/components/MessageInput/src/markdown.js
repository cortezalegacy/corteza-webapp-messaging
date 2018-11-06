export function exportToMarkdown (delta) {
  const parseAttr = (text, attributes) => {
    let out = text
    const md = {
      bold: '**',
      italic: '*',
      strike: '~~',
    }

    // Convert all HTML to markup
    // make sure this is all we support (quill's options.formats)
    Object.keys(md).filter(mdChar => attributes[mdChar]).forEach(mdChar => {
      out = md[mdChar] + out + md[mdChar]
    })

    return out
  }

  return delta.ops.map((op) => {
    let text = ''

    if (typeof (op.insert) === 'string') {
      text = op.insert
    } else if (op.insert.mention) {
      const m = op.insert.mention
      text = `<${m.denotationChar}${m.id} ${m.value}>`
    }

    if (op.attributes) {
      text = parseAttr(text, op.attributes)
    }

    return text
  }).join('')
}
