export default class Provider {
  constructor () {
    if (this.constructor === Provider) {
      throw new TypeError('class.abstract.noConstructor')
    }
  }

  connect () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  disconnect () {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  static async canConnect ({ api, jwt }) {
    throw new TypeError('class.abstract.noFunctionOverwrite')
  }

  get connected () {
    throw new TypeError('class.abstract.noGetterOverwrite')
  }
}
