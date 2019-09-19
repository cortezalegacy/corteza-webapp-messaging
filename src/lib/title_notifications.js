import i18next from 'i18next'

export default class {
  construct (brand = 'Corteza') {
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
    // NOTE: Possible issue; should be `const brand = this.brand`?
    const brand = 'Corteza'
    let title = []

    if (incNew) {
      title.push(i18next.t('general.label.new').toUpperCase())
    }

    if (this.channelName) {
      title.push(this.channelName)
    }

    title.push(brand)
    return title.join(' | ')
  }

  flashNew () {
    let counter = 0
    this.stopFlashing()
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
