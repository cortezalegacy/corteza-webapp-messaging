<template>
  <div class="input-wrapper">
    <div
      @keydown="suggestionNavigation"
      @keyup="updateValue"
      @focus="updateFocus(true)"
      @blur="updateFocus(false)"

      @focusout="fOut"
      @focusin="fIn"

      id="richInput"
      ref="richInput"
      data-nodetype="root"
      contenteditable><span><br/></span></div>
      <p
        v-if="placeholderShown"
        class="placeholder"
        contenteditable="false">

        {{ placeholder }}
      </p>
  </div>
    <!--<p><span><br/></span></p>-->
      <!--span>SP AN 1</span>
      <span class="triggered" data-id="idd">COMMAND</span>
      <span>SPAN 2</span-->
</template>

<script>
import triggers from '@/plugins/triggers'
import { Selection } from '@/libs/selection'
import { mapGetters } from 'vuex'

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

const INITIAL_INPUT_DOM = '<span><br/></span>'

export default {
  data () {
    return {
      value: '',
      focused: false,
      // When user selects from trigger suggestions - ignore submit
      ignoreNextSubmit: false,
      lastNode: null,
    }
  },

  methods: {
    fOut () {
      this.$set(this, 'lastNode', this.getCurentNode())
    },

    fIn () {
      this.$set(this, 'lastNode', null)
    },

    updateFocus (focused) {
      this.focused = focused
    },

    textAreaRef () {
      return this.$refs.richInput
    },

    resetInput () {
      // Reset input to initial state
      this.textAreaRef().innerHTML = INITIAL_INPUT_DOM
      this.$set(this, 'value', '')
      this.$emit('msgUpdate', { msg: this.value })
      this.$emit('nodeChunkChanged', { chunk: {} })
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
      // On submit
      if (SUBMIT_KEYCODES[e.which]) {
        if (this.ignoreNextSubmit) {
          this.ignoreNextSubmit = false
          return
        }

        if (this.suggestionsOpened) return

        // Shift key allows new line
        if (!e.shiftKey) {
          this.$emit('send', { submit: true })
          this.resetInput()
          return
        }
      }

      // User deleted it all...
      if (!this.textAreaRef().textContent) {
        this.resetInput()
        return
      }

      if (!IGNORED_KEYCODES[e.which]) {
        // Save selection state
        let selection = new Selection(this.textAreaRef())
        selection.saveCurrentSelection()

        // Process given node
        let { chunk } = this.processText(selection)

        // Restore selection state
        selection.restoreSelection()

        this.$emit('nodeChunkChanged', { chunk })

        // Pre process text for api
        this.processTriggeredText()
      }
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
        // ctr is before word, and end of curent word is after next cell
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

    // Parent callable - creates and inserts triggered node
    insertTriggeredNode (suggestion) {
      let node
      if (suggestion.prefix === '/') {
        node = document.createElement('span')
        node.appendChild(document.createTextNode(`${suggestion.prefix}${suggestion.command.command}`))
      } else {
        node = document.createElement('span')
        node.classList.add('triggered')
        node.appendChild(document.createTextNode(`${suggestion.prefix}${suggestion.command.command}`))
        this.addNodeTrigger(node, suggestion)
      }

      // Insert new node before this node; remove this node afterwords
      this.getCurentNode().insertAdjacentHTML('beforebegin', node.outerHTML)
      this.getCurentNode().insertAdjacentHTML('beforebegin', '<span> </span>')
      this.getCurentNode().parentNode.removeChild(this.getCurentNode())
      return true
    },

    // Checks given suggestions and determines if user's input is
    // enaugh to trigger given node
    isTriggerValid (suggestions = []) {
      return suggestions.length === 1
    },

    addNodeTrigger (node, suggestion) {
      node.classList.add('valid')

      node.dataset.triggered = true
      node.dataset.prefix = suggestion.prefix
      node.dataset.meta = JSON.stringify(suggestion.command.meta)

      delete node.dataset.invalid
    },

    removeNodeTrigger (node) {
      delete node.dataset.prefix
      delete node.dataset.meta

      node.dataset.invalid = true
      node.classList.remove('valid')
    },

    /**
     * Process current node. All text will be in a node nested to root p.
     * When a command is entered, that node is splitted in 2 new nodes and 1
     * special triggered node. With this approach we are able to process current chunk
     * relative to given node.
     */
    processText (selection) {
      // Get curent node
      let node = this.getCurentNode()
      let nodeCaretIndex = this.getCaretPositionRelative()
      let msg = node.textContent
      if (nodeCaretIndex < 0 || !msg) return

      let chunk = this.getCurentChunk(msg, nodeCaretIndex)
      let trigger = this.getInvokingTrigger(chunk)

      // Previus chunk is triggered; folowed by blank & just one suggestion -- make a new element
      if (node.dataset.triggered && !this.allowSpace && node.textContent.slice(-1) === ' ') {
        node.insertAdjacentHTML('afterend', `<span> </span>`)

        // Curent node is still focused, next node is focused after cursor adjustment
        node.innerHTML = node.innerHTML.trim()
        return { chunk }
      }

      // Curent chunk is empty,
      // If this node is not triggered and next one is neither, join them together
      let nextNode = node.nextElementSibling || undefined
      if (nextNode && !node.dataset.triggered && (nextNode && !nextNode.dataset.triggered)) {
        let concat = node.innerHTML + nextNode.innerHTML
        let newNode = `<span>${concat}</span>`
        node.outerHTML = newNode
        nextNode.parentNode.removeChild(nextNode)
      }

      if (trigger && trigger !== '/') {
        if (!node.dataset.triggered) {
          // Split chunk in 2 normal + 1 triggered chunks
          let leftChunk = msg.substring(0, chunk.first)
          let triggeredChunk = msg.substring(chunk.first, chunk.last)
          let rightChunk = msg.substring(chunk.last)

          if (leftChunk) node.insertAdjacentHTML('beforebegin', `<span>${leftChunk}</span>`)
          if (rightChunk) node.insertAdjacentHTML('afterend', `<span>${rightChunk}</span>`)
          if (triggeredChunk)
          { node.outerHTML = `<span class="triggered" data-triggered="true" data-invalid="true">${triggeredChunk}</span>` }
        }
      }

      return { chunk }
    },

    getInvokingTrigger (chunk) {
      let c = chunk.msg[0]
      if (triggers.isTrigger(c) && triggers.checkTriggerConstraints(c, chunk)) return c
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

    processTriggeredText () {
      let rtr = ''
      for (let c of this.textAreaRef().children) {
        let data = c.dataset
        if (data.triggered && !data.invalid) {
          let meta = JSON.parse(data.meta || '{}')
          rtr += `<${data.prefix}${meta.id}>`
        } else {
          rtr += c.textContent
        }
      }

      this.$set(this, 'value', rtr)
      this.$emit('msgUpdate', { msg: this.value })
    },
  },

  computed: {
    ...mapGetters({
      getSuggestions: 'suggestions/getSuggestions',
      suggestionsOpened: 'suggestions/isOpened',
    }),

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
      let trigger = this.getSuggestions[0]
      trigger = trigger.command.command.trim().toLowerCase()
      let entered = this.getCurentNode().textContent.toLowerCase().trim().substring(1)

      // If entered value is substring of trigger & entered !== trigger
      if (trigger.indexOf(entered) > -1 && trigger !== entered) return true
      return false
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
        } else {
          this.removeNodeTrigger(node)
        }

        this.processTriggeredText()
      },
      deep: true,
    },
  },

  props: {
    placeholder: {
      type: String,
      required: false,
      default: 'Jot something down',
    },
  },
}
</script>

<style scoped>
.input-wrapper {
  position: relative;
}
.input-wrapper p.placeholder {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  /* @darh this breaks the placeholder in firefox changed to 0 */
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

  margin-top: 15px;
  margin-left: 5px;
}
#richInput {
  -moz-appearance: textfield-multiline;
  -webkit-appearance: textarea;
  overflow: auto;
  white-space: pre-wrap;
  border:none;
}
#richInput:focus {
  border: none;
  outline: none!important;
}
</style>

<style>

#richInput span {
  /*margin-right: 5px;*/
  margin: 0;
}

#richInput p {
  margin: 0;
}

#richInput span.triggered {
  background-color: rgba(255, 68, 0, 0.336);
}

#richInput span.triggered.valid {
  background-color: rgba(68, 255, 100, 0.336);
}
</style>
