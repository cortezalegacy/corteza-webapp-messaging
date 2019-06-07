export default class Provider {
  constructor () {
    if (this.constructor === Provider) {
      throw new TypeError('class.abstract.noConstructor')
    }
  }

  async connect () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  async disconnect () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  async destroy () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  async get () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  async put () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }
}
