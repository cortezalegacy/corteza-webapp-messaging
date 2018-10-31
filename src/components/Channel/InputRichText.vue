<template>
  <div class="input-wrapper">
    <div
      class="dummy-node"
      ref="tmpNode"
      contenteditable="true"
      tabindex="-1" />

    <div
      class="richInput"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @focus="updateFocus(true)"
      @blur="updateFocus(false)"

      @paste="handlePaste"

      :id="inputName"
      :ref="inputName"
      data-nodetype="root"
      contenteditable>
      <p>
        <span><br/></span>
      </p></div>
      <p
        v-if="placeholderShown"
        class="placeholder"
        contenteditable="false" v-html="placeholder">
        {{ placeholder }}
      </p>
  </div>
    <!--<p><span><br/></span></p>-->
      <!--span>SP AN 1</span>
      <span class="triggered" data-id="idd">COMMAND</span>
      <span>SPAN 2</span-->
</template>

<script>

const NAVIGATION_X = {
  37: 'left',
  39: 'right',
}

const NAVIGATION_Y = {
  38: 'up',
  40: 'down',
  9: 'down',
}

const NAVIGATION_KEYS = Object.assign({}, NAVIGATION_X, NAVIGATION_Y)

const IGNORED_KEYCODES = Object.assign({}, NAVIGATION_KEYS, {
  27: true,
  13: true,
})
const SUBMIT_KEYCODES = { 13: true }

/**
 * Takes all nodes right of the right node & prepands them to the target node
 * in reverse order
 */
function recursiveNodeInsert (node, targetNode) {
  let { nextSibling } = node
  if (nextSibling) recursiveNodeInsert(nextSibling, targetNode)
  targetNode.prepend(node)
}

export default {
  data () {
    return {
      value: '',
      lastRawValue: null,
      focused: false,
      // When user selects from trigger suggestions - ignore submit
      ignoreNextSubmit: false,
      // No longer required - will keep for easier unit testing
      lastNode: null,
    }
  },

  methods: {
    pasteContent (content = '') {
      window.document.execCommand('insertText', false, content)
    },

    getClipboardContent (e, type = 'text/plain') {
      return (e.originalEvent || e).clipboardData.getData(type)
    },

    preProcessLines (node) {
      let rtr = []
      let { regex, indexedLists } = this.textToTriggerRegex
      let message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper

      regularChunkHandler = (message, wrapper) => {
        let normalNode = document.createElement('span')
        normalNode.appendChild(document.createTextNode(message))
        wrapper.appendChild(normalNode)
      }

      triggeredChunkHandler = (wrapper, trigger, triggeredText, meta) => {
        // Create a triggered node
        let triggeredNode = document.createElement('span')
        if (this.$triggers.prepareTriggeredNode(triggeredNode, trigger, triggeredText).trigger) {
          this.$triggers.addNodeTrigger(triggeredNode, trigger, meta)
        }
        wrapper.appendChild(triggeredNode)
      }

      matchDestructor = (match) => {
        let entire, trigger, id, name
        entire = match[0]
        trigger = entire[0]
        name = match[2] || match[3]
        id = name
        id = indexedLists[trigger][id].ID
        return { entire, trigger, id, name }
      }

      triggeredTextGetter = (match) => {
        return { triggeredText: match.name }
      }

      for (let l of node.childNodes) {
        message = l.textContent
        wrapper = document.createElement('p')
        this.$triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
        rtr.push(wrapper)
      }
      return rtr
    },

    neitherTriggered (n1, n2) {
      return !(n1.dataset.triggered || n2.dataset.triggered)
    },

    handlePaste (e) {
      let range = document.createRange()
      let tmpNode = this.$refs.tmpNode

      // Prevent default paste event
      e.preventDefault()

      // Trigger paste with empty string -- to clear out selection (if any)
      this.pasteContent()
      if (!this.textAreaRef().textContent) this.resetInput()

      // Remember the node and caret index
      let pNode, pCaretIndex
      pNode = this.getCurentNode()
      pCaretIndex = this.getCaretPositionRelative()

      // Get plain text from clipbord
      const text = this.getClipboardContent(e)

      // Focus dummy node & trigger paste with plain text
      this.pushToEnd(tmpNode)
      this.pasteContent(text)

      // Pre process temp node's lines
      let pLines
      pLines = this.preProcessLines(tmpNode)

      // Insert new lines to input
      /// / Split curent node at caret index into 2 span's
      let pNodeLeft, pNodeRight, pNodeContent

      pNodeContent = pNode.textContent
      pNodeLeft = document.createElement('span')
      pNodeLeft.appendChild(document.createTextNode(pNodeContent.substring(0, pCaretIndex)))

      pNodeRight = document.createElement('span')
      pNodeRight.appendChild(document.createTextNode(pNodeContent.substring(pCaretIndex)))

      /// / Replace targeted node wit left node, followed by right node
      this.insertBefore(pNode, pNodeLeft)
      this.insertAfter(pNodeLeft, pNodeRight)
      this.removeNode(pNode)

      /// / Update current node & current caret index
      pNode = pLines[pLines.length - 1].lastChild
      pCaretIndex = pNode.textContent.length

      /// / Take all right nodes and add them to the end of last pasted row
      let rNode

      let lastRow = pLines[pLines.length - 1]
      let lastChild = lastRow.lastChild
      rNode = pNodeLeft
      while ((rNode = rNode.nextSibling)) {
        this.insertAfter(lastRow.lastChild, rNode)
      }
      if (lastChild.nextSibling && this.neitherTriggered(lastChild, lastChild.nextSibling)) {
        this.mergeNodes(lastChild, lastChild.nextSibling)
      }


      /// / Insert all nodes from first pasted line after left node
      let firstRow = pLines[0]
      rNode = null
      while ((rNode = firstRow.lastChild)) {
        this.insertAfter(pNodeLeft, rNode)
      }
      if (pNodeLeft.nextSibling && this.neitherTriggered(pNodeLeft, pNodeLeft.nextSibling)) {
        // eslint-disable-next-line
        if (pNodeLeft.nextSibling == lastChild) {
          lastChild = pNodeLeft
          pCaretIndex += pNodeLeft.textContent.length
        }
        this.mergeNodes(pNodeLeft, pNodeLeft.nextSibling)
      }

      /// / Insert other rows
      // i ge of 0; because line 0 is already inserted
      for (let i = pLines.length - 1; i > 0; i--) {
        let line = pLines[i]
        this.insertAfter(pNodeLeft.parentNode, line)
      }

      // Clear up dummy node
      tmpNode.innerHTML = ''

      // Tmp reset caret to end of input
      pNode = this.textAreaRef().lastChild.lastChild
      lastChild.focus()
      this.pushCaretToIndex(lastChild, pCaretIndex, range)
    },

    updateFocus (focused) {
      this.focused = focused
    },

    textAreaRef () {
      return this.$refs[this.inputName]
    },

    resetInput () {
      // Reset node structure
      let { wrapper, blankNode } = this.getInitialDom()
      let root = this.textAreaRef()
      root.innerHTML = ''
      root.appendChild(wrapper)
      this.pushToStart(blankNode)

      // Reset input & emit change
      this.$set(this, 'value', '')
      this.$emit('nodeChunkChanged', { chunk: {} })
    },

    handleKeyDown (e) {
      this.preventInputJumps(e)
      this.handleLines(e)
      this.suggestionNavigation(e)
    },

    handleKeyUp (e) {
      this.updateValue(e)
    },

    preventInputJumps (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault()
      }
    },

    // On shift + enter, chunk up lines
    // Create a new line and a new blank node; After insert, puch caret to end of it - inside the blank node
    handleLines (e) {
      if (e.which === 13 && e.shiftKey) {
        e.preventDefault()

        // Current node and it's caret position
        let node = this.getCurentNode()
        let nodeCaretIndex = this.getCaretPositionRelative()
        if (node.dataset.triggered) {
          nodeCaretIndex = 0
        }

        // Split current node into 2 chunks
        let left, right, text
        text = node.textContent

        /// / Clone chunks so they are both the same
        left = document.createElement('span')
        right = node.cloneNode(true)

        /// / Default to <br>, so if there is no text for a node, it has an empty space
        left.innerHTML = text.substring(0, nodeCaretIndex) || '<br>'
        right.innerHTML = text.substring(nodeCaretIndex) || '<br>'

        /// / Keep left node where it should be....
        this.insertAfter(node, right)
        this.insertAfter(node, left)
        node.parentNode.removeChild(node)

        // Move right chunks to new line
        let line = document.createElement('p')
        recursiveNodeInsert(right, line)

        // Insert new line after current line.
        let nodeWalker = this.getCurentNode()
        while (nodeWalker && nodeWalker.tagName !== 'P') {
          nodeWalker = nodeWalker.parentNode
        }

        this.insertAfter(nodeWalker, line)

        // Focus the first node of new line
        this.pushToStart(line.firstChild)
      }
    },

    suggestionNavigation (e) {
      if (SUBMIT_KEYCODES[e.which] && this.suggestionsOpened) {
        this.$emit('selectFocused', { select: true })
        this.ignoreNextSubmit = true
        e.preventDefault()
        return
      }

      if (this.suggestionsOpened && NAVIGATION_Y[e.which]) {
        e.preventDefault()
        // Navigate suggestions
        this.$emit('navigateSuggestions', { direction: NAVIGATION_Y[e.which] })
      }
    },

    updateValue (e) {
      // Pressed up key && no value is entered
      if (NAVIGATION_Y[e.which] === 'up' && !this.value.trim()) {
        this.$emit('editLastMessage', {})
        return 'EDIT_LAST'
      }

      // On submit
      if (SUBMIT_KEYCODES[e.which]) {
        if (this.ignoreNextSubmit) {
          this.ignoreNextSubmit = false
          return 'IGNORED'
        }

        if (this.suggestionsOpened) return 'SUGGESTIONS_OPENED'

        // Shift key allows new line
        if (!e.shiftKey) {
          this.$emit('submit', { value: this.value.trim() })
          this.resetInput()
          return 'SUBMIT'
        }
      }

      // User deleted it all...
      if (!this.textAreaRef().textContent && !SUBMIT_KEYCODES[e.which]) {
        this.resetInput()
        return 'DELETED'
      }

      let isChanged = this.lastRawValue !== this.textAreaRef().textContent
      if (!IGNORED_KEYCODES[e.which] && isChanged) {
        // Process given node
        let node = this.getCurentNode()
        let nodeCaretIndex = this.getCaretPositionRelative()
        let { chunk } = this.processNodes(node, nodeCaretIndex)
        this.$emit('nodeChunkChanged', { chunk })

        // Pre process text for api
        this.processTriggeredText(this.textAreaRef())
      }

      this.lastRawValue = this.textAreaRef().textContent
    },

    getCurentChunk (msg, cursorIndex) {
      if (this.getCurentNode().dataset.nodetype === 'root')
      { return { index: 0, first: 0, last: 0, msg: '' } }

      // If node is triggered get entire content
      if (this.getCurentNode().dataset.triggered) {
        let word = this.getCurentNode().textContent
        return {
          // These 2 are relative to node, that's why 0
          index: 0,
          first: 0,
          last: word.length,
          msg: word.trim(),
        }
      }

      // Split msg to words and find current word
      msg = msg.split(/[ \n]/)

      let ctr = 0
      let word = ''
      for (let m of msg) {
        // ctr is before word, and end of current word is after next cell
        if (ctr <= cursorIndex && ctr + m.length >= cursorIndex) {
          word = m
          break
        }

        // +1, because spaces/new lines were removed
        ctr += m.length + 1
      }

      let first = ctr
      return {
        index: first,
        first,
        last: ctr + word.length,
        msg: word.trim(),
      }
    },

    getCurentNode () {
      if (this.lastNode !== null) return this.lastNode
      let node = document.getSelection().anchorNode
      if (!node) return false
      return node.nodeType === 3 ? node.parentNode : node
    },

    // To set input value from the outside
    setValue (value = '') {
      // No value -- keep it reset
      if (!value) {
        this.resetInput()
        return
      }

      // Need to clear out the input; insert new nodes; push to end of last node
      // There will always be atleas 1 row, because there is some text available.
      let root = this.textAreaRef()
      root.innerHTML = ''
      let lastNode

      let newNodesWrapper = this.$triggers.getNodes(value)
      while (newNodesWrapper.childNodes.length) {
        let [ row ] = newNodesWrapper.childNodes
        root.appendChild(row)
        lastNode = row.lastChild
      }

      this.value = value
      this.pushToEnd(lastNode)
    },

    // Ref: https://stackoverflow.com/a/3866442
    pushToEnd (el) {
      this.pushCaret(el, false)
    },

    pushToStart (el) {
      this.pushCaret(el, true)
    },

    pushCaret (el, start = false) {
      let range, selection
      // Firefox, Chrome, Opera, Safari, IE 9+
      if (document.createRange) {
        // Create a range (a range is a like the selection but invisible)
        range = document.createRange()
        // Select the entire contents of the element with the range
        range.selectNodeContents(el)
        // collapse the range to the end point. false means collapse to end rather than the start
        range.collapse(start)
        // get the selection object (allows you to change selection)
        selection = window.getSelection()
        // remove any selections already made
        selection.removeAllRanges()
        // make the range you have just created the visible selection
        selection.addRange(range)
      } else if (document.selection) {
        // IE 8 and lower
        // Create a range (a range is a like the selection but invisible)
        range = document.body.createTextRange()
        // Select the entire contents of the element with the range
        range.moveToElementText(el)
        // collapse the range to the end point. false means collapse to end rather than the start
        range.collapse(start)
        // Select the range (make it the visible selection
        range.select()
      }
    },

    pushCaretToIndex (node, index, range) {
      let textNode = this.getTextNode(node)
      range.setStart(textNode, index)
      range.collapse(true)

      let selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    },

    extractSuggestion (suggestion = {}) {
      let { prefix, command: commandObj } = suggestion
      let { meta = {}, command } = commandObj || {}

      return { prefix, meta, command }
    },

    // Parent callable - creates and inserts triggered node
    insertTriggeredNode (suggestion) {
      if (!suggestion) return false
      let currentNode = this.getCurentNode()

      // Prepare triggered node...
      let node = document.createElement('span')
      let { prefix, command } = this.extractSuggestion(suggestion)
      if (this.$triggers.prepareTriggeredNode(node, prefix, command).trigger) {
        this.addNodeTrigger(node, suggestion)
      }
      this.insertBefore(currentNode, node)

      // If needed, create a new blank node
      let { nextSibling } = currentNode
      let blankNode
      if (!nextSibling) {
        blankNode = document.createElement('span')
        blankNode.appendChild(document.createTextNode(' '))
        this.insertBefore(currentNode, blankNode)
        this.pushToEnd(blankNode)
      } else {
        this.pushToStart(nextSibling)
      }

      currentNode.parentNode.removeChild(currentNode)

      return true
    },

    // Checks given suggestions and determines if user's input is
    // enaugh to trigger given node
    isTriggerValid (suggestions = []) {
      return suggestions.length === 1
    },

    addNodeTrigger (node, suggestion) {
      if (!suggestion) return false

      let { prefix, meta } = this.extractSuggestion(suggestion)
      this.$triggers.addNodeTrigger(node, prefix, meta)
    },

    insertAfter (ref, node) {
      ref.parentNode.insertBefore(node, ref.nextSibling)
    },

    insertBefore (ref, node) {
      ref.parentNode.insertBefore(node, ref)
    },

    removeNode (ref) {
      ref.parentNode.removeChild(ref)
    },

    // Update's left's content with merged content
    mergeNodes (left, right) {
      // Create a concated content
      let concat = left.textContent + right.textContent
      left.innerHTML = concat

      // Remove unneded next sibling node
      this.removeNode(right)
    },

    // Gives node's text node
    getTextNode (node) {
      return Array.from(node.childNodes).find(n => n.nodeType === Node.TEXT_NODE)
    },

    /**
     * Process current node. All text will be in a node nested to root p.
     * When a command is entered, that node is splitted in 2 new nodes and 1
     * special triggered node. With this approach we are able to process current chunk
     * relative to given node.
     */
    processNodes (node, nodeCaretIndex) {
      // Get current node
      let msg = node.textContent

      // If node has no content it should be deleted -- in case if browser does not
      // do it by it's self...
      if (!msg) {
        let tmpNode, toStart

        // If no previous sibling available, use next sibling
        tmpNode = node.previousSibling
        toStart = false
        if (!tmpNode) {
          tmpNode = node.nextSibling
          toStart = true
        }

        // If next sibling is not available, this is the only one
        if (tmpNode) {
          node.parentNode.removeChild(node)
          // If tag is at the start
          this.pushCaret(tmpNode, toStart)
          node = tmpNode
          msg = node.textContent
        } else {
          this.pushToStart(node)
        }
      }

      if (nodeCaretIndex < 0 || !msg) return false

      let chunk = this.getCurentChunk(msg, nodeCaretIndex)
      let trigger = this.getInvokingTrigger(chunk)

      // Previous chunk is triggered; folowed by blank & just one suggestion -- make a new element
      if (node.dataset.triggered && !this.allowSpace && node.textContent.slice(-1) === ' ') {
        // New blank node with a space -- add to end and set caret to end of node
        let blankNode = document.createElement('span')
        blankNode.appendChild(document.createTextNode(' '))
        this.insertAfter(node, blankNode)

        // Trim triggered node's text
        node.innerHTML = node.innerHTML.trim()
        this.pushToEnd(blankNode)
        return { chunk }
      }

      // Current chunk is empty,
      // If this node is not triggered and next one is neither, join them together
      let nextNode = node.nextElementSibling || undefined
      if (nextNode && !node.dataset.triggered && (nextNode && !nextNode.dataset.triggered)) {
        // Will have to update caret's position - place it to end of previous text node
        let nodeCaretIndex = node.textContent.length

        this.mergeNodes(node, nextNode)

        /**
         * Update caret to new text node's position
         *  - set a start selection on new text node, based on prev. text node
         *  - collapse to that selection
         *  - make selection visible
         */
        this.pushCaretToIndex(node, nodeCaretIndex)
      }

      if (trigger && trigger !== '/') {
        if (!node.dataset.triggered) {
          // Split chunk in 2 normal + 1 triggered chunks
          let leftChunk = msg.substring(0, chunk.first)
          let triggeredChunk = msg.substring(chunk.first, chunk.last)
          let rightChunk = msg.substring(chunk.last)

          if (leftChunk) node.insertAdjacentHTML('beforebegin', `<span>${leftChunk}</span>`)
          if (rightChunk) node.insertAdjacentHTML('afterend', `<span>${rightChunk}</span>`)
          if (triggeredChunk) {
            node.innerHTML = triggeredChunk
            node.dataset.triggered = true
            node.dataset.invalid = true
            node.classList.add('triggered')
            this.pushToEnd(node)
          }
        }
      }

      return { chunk }
    },

    getInvokingTrigger (chunk) {
      let c = chunk.msg[0]
      if (this.$triggers.isTrigger(c) && this.$triggers.checkTriggerConstraints(c, chunk)) return c
      return false
    },

    getCaretPositionRelative () {
      if (window.getSelection && window.getSelection().getRangeAt) {
        var range = window.getSelection().getRangeAt(0)
        var selectedObj = window.getSelection()
        var rangeCount = 0
        var childNodes = selectedObj.anchorNode.parentNode.childNodes
        for (var i = 0; i < childNodes.length; i++) {
          if (childNodes[i] === selectedObj.anchorNode) {
            break
          }
          if (childNodes[i].outerHTML)
          { rangeCount += childNodes[i].outerHTML.length }
          else if (childNodes[i].nodeType === 3) {
            rangeCount += childNodes[i].textContent.length
          }
        }
        return range.startOffset + rangeCount
      }
      return -1
    },

    markSafezones (text, safezones, regex, currentIndex = 0) {
      // Loop will break when no more matches are available
      while (true) {
        let match = regex.exec(text)
        if (!match) return

        let index, matched
        matched = match[0]
        index = currentIndex + match.index

        // Update text
        text = text.substring(index + matched.length)

        // Update safezones
        safezones.push({ from: index, to: index + matched.length })
      }
    },

    isInSafezone (range, safezones) {
      // Check if trFrom and trTo are included as [] within known safe zones from and to
      let { from: trFrom, to: trTo } = range
      return !!(safezones.find(({ from, to }) => from <= trFrom && trTo <= to))
    },

    processTriggeredText (inptRef) {
      let rtr, safezones, regex
      safezones = []
      rtr = ''

      // Check multiline safezones
      regex = /(([`]{3}).*?\2)/
      this.markSafezones(inptRef.textContent, safezones, regex)

      let currentIndex = 0
      for (let r of inptRef.children) {
        // Within each line check for single line safezones
        regex = /([^`]|)((`)[^`]+?\3)\1/
        this.markSafezones(r.textContent, safezones, regex, currentIndex)

        for (let c of r.children) {
          let data = c.dataset

          if (data.triggered && !data.invalid) {
            // Check if trigger is within safezone
            let range = { from: currentIndex, to: currentIndex + c.textContent.length }

            if (!this.isInSafezone(range, safezones)) {
              let meta = JSON.parse(data.meta || '{}')
              rtr += `<${data.prefix}${meta.id}>`
            } else {
              rtr += c.textContent
            }
          } else {
            rtr += c.textContent
          }

          currentIndex += c.textContent.length
        }
        rtr += '\n'
      }

      this.$set(this, 'value', rtr)
      this.$emit('msgUpdate', { msg: this.value })
    },

    // Treat it as an object factory
    getInitialDom () {
      let blankNode = document.createElement('span')
      blankNode.appendChild(document.createElement('br'))

      let wrapper = document.createElement('p')
      wrapper.appendChild(blankNode)
      return { wrapper, blankNode }
    },
  },

  computed: {
    textToTriggerRegex () {
      let lists = { '@': this.$triggers.userList(), '#': this.$triggers.channelList() }
      let indexedLists = {}
      let rtr = '('

      let getTag = (obj) => {
        return obj.name || obj.username || obj.ID || ''
      }

      let indexList = (list) => {
        let rtr = {}
        for (let l of list) {
          rtr[getTag(l)] = l
        }
        return rtr
      }

      for (let t in lists) {
        indexedLists[t] = indexList(lists[t])
        rtr = `${rtr}${t}(`
        let tags = ''
        // Sort by length
        let list = [...lists[t]].sort((a, b) => {
          return getTag(b).length - getTag(a).length
        })

        for (let g of list) {
          let tag = getTag(g)
          if (tag) {
            tags = `${tags}${tag}|`
          }
        }

        tags = tags.substring(0, tags.length - 1)
        rtr = `${rtr}${tags})|`
      }
      return { regex: new RegExp(`${rtr.substring(0, rtr.length - 1)})`, 'g'), indexedLists }
    },

    getSuggestions () {
      return this.tsMeta.suggestions || []
    },

    suggestionsOpened () {
      return !!this.tsMeta.opened
    },

    placeholderShown () {
      return !this.focused && !this.value
    },

    allowSpace () {
      // Determine if suggestions have spaces
      let spaces = !!this.getSuggestions.reduce(
        (acc, cur) => {
          return Math.max(acc, (cur.command.command.match(/ /g) || []).length)
        }, 0)

      // suggestions have no spaces
      if (!spaces) return false

      // Check matching
      let [ trigger ] = this.getSuggestions
      trigger = trigger.command.command.trim().toLowerCase()
      let entered = this.getCurentNode().textContent.toLowerCase().trim().substring(1)

      // If entered is equal to suggestion don't allow space, so the param finishes
      return trigger !== entered
    },
  },

  watch: {
    // If suggestions change and triggered node is focused; update its
    // validity
    getSuggestions: {
      handler: function (suggestions) {
        let node = this.getCurentNode()
        if (!node) return

        if (node.dataset.triggered && this.isTriggerValid(suggestions)) {
          this.addNodeTrigger(node, suggestions[0])
        } else if (node.dataset.triggered) {
          this.$triggers.removeNodeTrigger(node)
        }

        this.processTriggeredText(this.textAreaRef())
      },
      deep: true,
    },
  },

  props: {
    placeholder: {
      type: String,
      required: false,
      default: '<strong>Write</strong> a Message',
    },
    tsMeta: {
      type: Object,
      required: false,
      default: () => { return {} },
    },
    inputName: {
      type: String,
      required: true,
      default: 'richInput',
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.input-wrapper {
  position: relative;
}

.input-wrapper .placeholder {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  /* @note : this breaks the placeholder in firefox changed to 0 */
  /* z-index: -1; */
  z-index:0;
  nav-index: -1;
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  opacity: 0.35;
  display:inline-block;
  line-height:40px;
}
.richInput {
  pointer-events: none;
  -moz-appearance: textfield-multiline;
  -webkit-appearance: textarea;
  overflow: auto;
  white-space: pre-wrap;
  border:none;
}
.richInput:focus {
  border: none;
  outline: none!important;
}

.dummy-node {
  // display: none;
  position: absolute;
  top: 1000px;
  pointer-events: none;
}

@media (min-width: $wideminwidth)
{
  line-height:45px;
}


</style>

<style>

.richInput span {
  /*margin-right: 5px;*/
  margin: 0;
}

.richInput p {
  margin: 0;
  pointer-events: all;
}

.richInput span.triggered {
  background-color: rgba(255, 68, 0, 0.336);
}

.richInput span.triggered.valid {
  background-color: rgba(68, 255, 100, 0.336);
}

</style>
