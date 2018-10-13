export class Selection {
  constructor ($container) {
    this.$container = $container
  }

  getSelection () {
    if (window.getSelection) {
      return window.getSelection().getRangeAt(0)
    } else if (document.selection) {
      return document.selection.createRange()
    }
  }

  sumCurrentOffset (root, node, startOffset) {
    for (let ele of Array.from(root.childNodes)) {
      if (node === ele) {
        break
      }
      if (ele.contains(node)) {
        const result = this.sumCurrentOffset(ele, node, 0)
        startOffset += result
        break
      } else {
        startOffset += ele.textContent.length
      }
    }
    return startOffset
  }

  findNodeForPosition ($container, currentOffset) {
    let node;
    ({ node, currentOffset } = this.findNode(
      $container.childNodes,
      currentOffset
    ))
    if (node.childNodes.length === 0) {
      return { node, currentOffset }
    } else {
      return this.findNodeForPosition(node, currentOffset)
    }
  }

  findNode (childNodes, currentOffset) {
    for (let node of Array.from(childNodes)) {
      if (currentOffset - node.textContent.length <= 0) {
        return { node, currentOffset }
      } else {
        currentOffset -= node.textContent.length
      }
    }
  }

  saveCurrentSelection () {
    this.currentSelection = this.getSelection()
    this.startOffset = this.currentSelection.startOffset
    this.currentOffset = this.sumCurrentOffset(
      this.$container,
      this.currentSelection.startContainer,
      this.startOffset
    )
  }

  restoreSelection () {
    let node
    if (this.currentOffset === 0) {
      return
    }
    const range = document.createRange();
    ({ node, currentOffset: this.currentOffset } = this.findNodeForPosition(
      this.$container,
      this.currentOffset
    ))
    range.setStart(node, this.currentOffset)
    range.collapse(true)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
