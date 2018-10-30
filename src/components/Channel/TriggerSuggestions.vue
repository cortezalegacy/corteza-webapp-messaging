<template>
  <div
    v-if="pannelOpened"
    ref="triggerSuggestions"
    class="suggestions-pannel"
    @keyup.enter="selectFocused"
    @mousedown="preventFocusChange">

    <div class="header">
      header

      <span class="navigation">
        &#8593;, &#8595;, tab; enter to select
      </span>
    </div>
    <div
      class="body"
      ref="suggestionList">

      <div
        v-for="c in getSuggestions"
        :key="c.meta.id || c.command"
        :class="{command: true, focused: isFocused(c)}"
        @click="selectSuggestion(c)">

        <p>
          {{ c.command }} <span v-html="getCommandParams(c)" />
        </p>
        <small>
          {{ c.description }}
        </small>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      curentSelected: 0,
    }
  },

  props: {
    msg: {
      typs: Object,
      required: false,
      default: () => { return {} },
    },
  },

  name: 'sugestions-pannel',

  methods: {
    preventFocusChange (e) {
      e.stopImmediatePropagation()
      e.preventDefault()
    },

    updateTSMeta (meta) {
      this.$emit('updateMeta', { meta })
    },

    selectFocused () {
      this.selectSuggestion(this.getSuggestions[this.curentSelected])
    },

    adjustScroll () {
      this.$refs.suggestionList.children[this.curentSelected].scrollIntoView(false, { block: 'nearest' })
    },

    next () {
      this.curentSelected = (this.curentSelected + 1) % this.getSuggestions.length
      this.adjustScroll()
    },

    previous () {
      if (this.curentSelected - 1 < 0) {
        this.curentSelected = this.getSuggestions.length - 1
      } else {
        this.curentSelected--
      }
      this.adjustScroll()
    },

    isFocused (c) {
      return (this.getSuggestions[this.curentSelected] || {}).command === c.command
    },

    getCommandParams ({ params }) {
      if (params) {
        let paramString = '<span>'

        for (let param of params) {
          if (!param.required) paramString += ` [${param.key}]`
          else paramString += ` ${param.key}`
        }
        return paramString.trim()
      }
    },

    selectSuggestion (command) {
      this.$emit('selectSuggestion', { command, prefix: this.getInvokingTrigger })
    },

    checkCommandConstraints (command, msg) {
      let { constraints } = command
      if (!constraints) return true

      // Correct index
      if (constraints.index !== undefined && constraints.index !== msg.index) return false
      return true
    },
  },

  computed: {
    ...mapGetters({
      channelList: 'channels/list',
      userList: 'users/list',
      getCommands: 'suggestions/getCommands',
    }),

    availableSlashCommands () {
      let rtr = {}
      rtr['channel'] = this.channelList.map(c => { return { command: c.name, meta: { id: c.ID }, params: [] } })
      rtr['user'] = this.userList.map(u => { return { command: u.username, meta: { id: u.ID }, params: [] } })

      rtr['command'] = this.getCommands

      return rtr[this.getCommandType] || []
    },

    getMsg () {
      return this.msg.msg || ''
    },

    getCommandIndex () {
      return this.msg.index || -1
    },

    getSuggestions () {
      // Search only by command (first word before space)
      let searched = this.getMsg.substring(1).trim()
      return this.availableSlashCommands.filter(
        asc => asc.command.toLowerCase().indexOf(searched.toLowerCase()) > -1
      )
    },

    getInvokingTrigger () {
      let c = this.getMsg[0]
      if (this.$triggers.isTrigger(c) && this.$triggers.checkTriggerConstraints(c, this.msg)) return c
      return false
    },

    getCommandType () {
      return (this.$triggers.isTriggered(this.getInvokingTrigger) || {}).type
    },

    pannelOpened () {
      return !!this.getInvokingTrigger
    },
  },

  watch: {
    pannelOpened: {
      handler: function (opened) {
        this.updateTSMeta({ opened })
      },
    },

    msg: {
      handler: function (msg) {
        this.curentSelected = 0
      },
      deep: true,
    },

    getSuggestions: {
      handler: function (suggestions) {
        let processed = []
        for (let s of suggestions) {
          processed.push({
            command: s,
            prefix: this.getInvokingTrigger,
          })
        }
        this.updateTSMeta({ suggestions: processed })
      },
      deep: true,
    },
  },
}
</script>

<style scoped>
.suggestions-pannel {
  top: 0;
  max-height: 300px;
  background-color: #FAFAFA;
  width: 100%;
  box-shadow: 0 0 5px #1E1E1EA5;
  border-radius: 10px;
  overflow: scroll;
}
.suggestions-pannel .header {
  position: sticky;
  top: 0;
  background-color: #F1F1F1;
  padding: 10px 5px;
  border-bottom: 1px solid #8a8a8a;
}

.suggestions-pannel .body .command {
  background-color: transparent;
  padding: 5px 10px;
  cursor: pointer;
}

.suggestions-pannel .body .command.focused {
  background-color: orange;
}

.suggestions-pannel .body .command:hover {
  background-color: #1E1E1E15;
}

.suggestions-pannel .body .command.focused:hover {
  background-color: rgba(255, 166, 0, 0.463);
}

</style>
