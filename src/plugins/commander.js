// import triggers from '@/plugins/triggers'

export default {
  methods: {
    execLocal (command) {
      command = command.trim().substring(1).split(' ')
      let { handler } = this.$triggers.isLocalCommand(command[0])
      if (handler) {
        (handler)(this, command.slice(1))
        return true
      }

      return false
    },
  },
}
