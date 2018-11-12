export default class {
  construct (brand = 'Crust') {
    this.brand = brand
    this.channelName = null
    this.flashInterval = 1500

    this.intervalHandle = null
  }

  update (params = {}) {
    if (document) {
      document.title = this.generateTitle(params)
    }

    return this
  }

  setChannelName (name) {
    this.channelName = name
    return this
  }

  generateTitle ({ incNew = false }) {
    const brand = 'Crust'
    let title = []

    if (incNew) {
      title.push('NEW')
    }

    if (this.channelName) {
      title.push(this.channelName)
    }

    title.push(brand)
    return title.join(' | ')
  }

  flashNew () {
    let counter = 0
    this.intervalHandle = window.setInterval(() => {
      this.update({ incNew: counter % 2 === 0 })
      counter++
    }, 1000) // 1.5s
    return this
  }

  stopFlashing () {
    if (this.intervalHandle) {
      window.clearInterval(this.intervalHandle)
    }

    return this.update({ incNew: false })
  }
}
