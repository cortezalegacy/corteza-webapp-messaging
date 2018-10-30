export default {
  install (Vue, { store }) {
    Vue.prototype.$commands = {
      test (str) {
        return str.length > 1 && str[0] === '/'
      },

      get (command) {
        return store.getters['suggestions/getCommand'](command)
      },

      exec (vm, str, { channel }) {
        const [name, ...params] = str.trim().substring(1).split(' ')
        const cmd = this.get(name)

        if (cmd) {
          console.debug('Executing command', { name, params, cmd })
          cmd.handler(vm, { channel, params, input: params.join(' ') })
        } else {
          console.error('Unknown command', name)
        }
      },
    }
  },
}
