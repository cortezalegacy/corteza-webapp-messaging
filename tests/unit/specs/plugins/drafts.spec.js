import { expect } from 'chai'
import { makeKey, get, remove, set } from '@/plugins/drafts'

class Api {
  constructor () {
    this.state = {}
  }

  getItem (k) {
    return this.state[k]
  }
  setItem (k, v) {
    this.state[k] = v
  }
  removeItem (k) {
    delete this.state[k]
  }
}

describe('plugins/drafts.js', () => {
  let ctx
  let api

  beforeEach(() => {
    api = new Api()
    ctx = { prefix: 'draft', api }
  })

  describe('makeKey', () => {
    it('params.invalid', () => {
      let params = {}
      ctx.prefix = undefined
      expect(() => makeKey.call(ctx, params)).to.throw('draft.key.invalid')

      params = { channelID: 'ch1' }
      ctx.prefix = undefined
      expect(() => makeKey.call(ctx, params)).to.throw('draft.key.invalid')

      params = { messageID: 'ch1' }
      ctx.prefix = undefined
      expect(() => makeKey.call(ctx, params)).to.throw('draft.key.invalid')
    })

    it('channelID', () => {
      let params = { channelID: 'ch1' }
      expect(makeKey.call(ctx, params)).to.eq('draft.ch1')
    })

    it('messageID', () => {
      let params = { messageID: 'ms1' }
      expect(makeKey.call(ctx, params)).to.eq('draft.ms1')
    })

    it('messageID.important', () => {
      let params = { channelID: 'ch1', messageID: 'ms1' }
      expect(makeKey.call(ctx, params)).to.eq('draft.ms1')
    })
  })

  describe('get', () => {
    const dest = { channelID: 'ch1' }
    beforeEach(() => {
      ctx.makeKey = makeKey
    })

    it('empty', () => {
      expect(get.call(ctx, dest)).to.eq(undefined)
    })

    it('mis', () => {
      api.state['draft.ch2'] = 'value'
      expect(get.call(ctx, dest)).to.eq(undefined)
    })

    it('hit.object', () => {
      let stringified = JSON.stringify({ k: 'value' })
      api.state['draft.ch1'] = stringified
      expect(get.call(ctx, dest)).to.deep.eq(JSON.parse(stringified))
    })
  })

  describe('remove', () => {
    const dest = { channelID: 'ch1' }
    beforeEach(() => {
      ctx.makeKey = makeKey
    })

    it('empty', () => {
      expect(api.state).to.deep.eq({})
      remove.call(ctx, dest)
      expect(api.state).to.deep.eq({})
    })

    it('missed', () => {
      api.state['draft.ch2'] = 'value'
      remove.call(ctx, dest)
      expect(api.state).to.deep.eq({ 'draft.ch2': 'value' })
    })

    it('removed', () => {
      api.state['draft.ch1'] = 'value'
      api.state['draft.ch2'] = 'value'
      remove.call(ctx, dest)
      expect(api.state).to.deep.eq({ 'draft.ch2': 'value' })

      remove.call(ctx, { channelID: 'ch2' })
      expect(api.state).to.deep.eq({})
    })
  })

  describe('set', () => {
    const dest = { channelID: 'ch1' }
    beforeEach(() => {
      ctx.makeKey = makeKey
    })

    it('add', () => {
      let value = { k1: 'v1' }
      set.call(ctx, dest, value)
      expect(api.state).to.deep.eq({ 'draft.ch1': '{"k1":"v1"}' })

      value = { k2: 'v2' }
      set.call(ctx, { channelID: 'ch2' }, value)
      expect(api.state).to.deep.eq({ 'draft.ch1': '{"k1":"v1"}', 'draft.ch2': '{"k2":"v2"}' })
    })

    it('update', () => {
      api.state['draft.ch1'] = '{"k1":"v1"}'
      let value = { k2: 'v2' }
      set.call(ctx, dest, value)
      expect(api.state).to.deep.eq({ 'draft.ch1': '{"k2":"v2"}' })
    })
  })
})
