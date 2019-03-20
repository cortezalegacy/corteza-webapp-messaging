export default {
  methods: {
    // Allow only if it is a 'File'
    handleShow (e, allow = () => {}) {
      if (e.dataTransfer.types.indexOf('Files') < 0) return
      allow()
    },
  },
}
