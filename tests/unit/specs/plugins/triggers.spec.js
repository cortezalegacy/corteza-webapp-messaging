/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { createLocalVue } from '@vue/test-utils'
import triggers from '@/plugins/triggers'

let localVue
let $triggers

describe('triggers.js', () => {
  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(triggers, {
      userByID: () => { return {} },
      channelByID: () => { return {} },
    })
    $triggers = localVue.prototype.$triggers
  })

  it('Should have $triggers', () => {
    expect($triggers).to.not.equal(undefined)
  })

  it('Should be able to traverse stings', () => {
    let regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper, expected
    regex = /<([#@])(.{3})>/g
    message = ''
    regularChunkHandler = (normalChunk, wrapper) => { wrapper.push(normalChunk) }
    triggeredChunkHandler = (wrapper, trigger, triggeredText, meta) => { wrapper.push(meta.id) }
    matchDestructor = (match) => {
      let [ entire, trigger, id ] = match
      return { entire, trigger, id }
    }
    triggeredTextGetter = (match) => {
      let { id } = match
      return { triggeredText: id }
    }

    // Empty string
    wrapper = []
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(0)

    // Some text
    wrapper = []
    expected = ['hehe']
    message = 'hehe'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)

    // Multi word & line
    wrapper = []
    expected = ['hehe hoho\nnano']
    message = 'hehe hoho\nnano'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)

    // One triggered word
    wrapper = []
    expected = ['123']
    message = '<@123>'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)

    // Multiple triggered words
    wrapper = []
    expected = ['123', ' ', '321']
    message = '<@123> <#321>'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)

    wrapper = []
    expected = ['123', '321']
    message = '<@123><#321>'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)

    wrapper = []
    expected = ['123', 'hehe', '321', '\n haha']
    message = '<@123>hehe<#321>\n haha'
    $triggers.traverseMessage(regex, message, regularChunkHandler, triggeredChunkHandler, matchDestructor, triggeredTextGetter, wrapper)
    expect(wrapper).to.have.length(expected.length)
    expect(wrapper).to.deep.equal(expected)
  })

  it('Should be able to tell if chunk is triggered', () => {
    expect($triggers.isTriggered('human')).to.equal(false)
    expect($triggers.isTriggered('human')).to.equal(false)

    expect($triggers.isTriggered('@human')).to.not.equal(false)
    expect($triggers.isTriggered('@human')).to.not.equal(false)

    expect($triggers.isTriggered('#human')).to.not.equal(false)
    expect($triggers.isTriggered('#human')).to.not.equal(false)

    expect($triggers.isTriggered('/human')).to.not.equal(false)
    expect($triggers.isTriggered('/human')).to.not.equal(false)
  })

  it('Should be able to tell if a character is a trigger', () => {
    expect($triggers.isTriggered('h')).to.equal(false)
    expect($triggers.isTriggered('h')).to.equal(false)

    expect($triggers.isTriggered()).to.equal(false)
    expect($triggers.isTriggered()).to.equal(false)

    expect($triggers.isTriggered('@')).to.not.equal(false)
    expect($triggers.isTriggered('@')).to.not.equal(false)

    expect($triggers.isTriggered('#')).to.not.equal(false)
    expect($triggers.isTriggered('#')).to.not.equal(false)

    expect($triggers.isTriggered('/')).to.not.equal(false)
    expect($triggers.isTriggered('/')).to.not.equal(false)
  })

  it('Should be able to check trigger constraints', () => {
    // No trigger...
    expect($triggers.checkTriggerConstraints()).to.equal(false)
    expect($triggers.checkTriggerConstraints()).to.equal(false)

    expect($triggers.checkTriggerConstraints('cookie')).to.equal(false)
    expect($triggers.checkTriggerConstraints('cookie')).to.equal(false)

    // No constraints
    expect($triggers.checkTriggerConstraints('@human')).to.equal(true)
    expect($triggers.checkTriggerConstraints('@human')).to.equal(true)

    expect($triggers.checkTriggerConstraints('#cat')).to.equal(true)
    expect($triggers.checkTriggerConstraints('#cat')).to.equal(true)

    // Constraint - failed - no msg
    expect($triggers.checkTriggerConstraints('/ding')).to.equal(false)
    expect($triggers.checkTriggerConstraints('/ding')).to.equal(false)

    // Constraint - failed - constraint failed
    expect($triggers.checkTriggerConstraints('/ding', { index: 10 })).to.equal(false)
    expect($triggers.checkTriggerConstraints('/ding', { index: 10 })).to.equal(false)

    // Constraint - failed - ok
    expect($triggers.checkTriggerConstraints('/ding', { index: 0 })).to.equal(true)
    expect($triggers.checkTriggerConstraints('/ding', { index: 0 })).to.equal(true)
  })

  it('Should be able to get history line chunks', () => {
    let message, buffer

    let countRegulars = (arr) => arr.filter(c => !c.triggered).length
    let countTriggered = (arr) => arr.length - countRegulars(arr)

    // Empty string
    message = ''
    expect($triggers.getLineChunks(message).message).to.eq('')
    expect($triggers.getLineChunks(message).message).to.eq('')

    // Just normal words
    message = 'hello there humans'
    buffer = $triggers.getLineChunks(message)
    expect(buffer).to.not.eq('')

    // Just triggered words
    message = '<@123><#321><#333>'
    buffer = $triggers.getLineChunks(message)
    expect(buffer).to.not.eq('')

    // Mixed
    message = '<@123> <#321> do <#333> be'
    buffer = $triggers.getLineChunks(message)
    expect(buffer).to.not.eq('')
  })

  it('Should be able to get chunk lines', () => {
    let message

    // Nothing
    message = ''
    expect($triggers.getChunks(message).message).to.eq('')
    expect($triggers.getChunks(message).message).to.eq('')

    // Some regular text
    message = 'hello'
    expect($triggers.getChunks(message)).to.not.eq('')
    expect($triggers.getChunks(message)).to.not.eq('')

    message = 'hello humans'
    expect($triggers.getChunks(message)).to.not.eq('')
    expect($triggers.getChunks(message)).to.not.eq('')

    // Some regular text - multi lined
    message = 'hello\ndd'
    expect($triggers.getChunks(message)).to.not.eq('')
    expect($triggers.getChunks(message)).to.not.eq('')

    message = 'hello\ndd\n\n'
    expect($triggers.getChunks(message)).to.not.eq('')
    expect($triggers.getChunks(message)).to.not.eq('')

    // Some triggered text
    message = 'hello <@123> of <#333> where is this'
    expect($triggers.getChunks(message)).to.not.eq('')
    expect($triggers.getChunks(message)).to.not.eq('')
  })

  it('Should be able to get input line nodes', () => {
    let message, buffer, expected, child

    // No text
    message = ''
    expect($triggers.getLineNodes(message)).to.be.empty
    expect($triggers.getLineNodes(message)).to.be.empty

    // Empty lines
    message = '\n'
    buffer = $triggers.getLineNodes(message)
    expect(buffer.textContent).to.equal('\n')
    expect(buffer.nodeName).to.equal('P')
    expect(buffer.childNodes).to.have.length(1)
    child = buffer.childNodes[0]
    expect(child.nodeName).to.equal('SPAN')
    expect(Object.keys(child.dataset)).to.have.length(0)
    expect(child.textContent).to.equal('\n')

    // Regular old text
    expected = message = 'Hello there mr. human'
    buffer = $triggers.getLineNodes(message)
    expect(buffer.textContent).to.equal(expected)
    expect(buffer.nodeName).to.equal('P')
    expect(buffer.childNodes).to.have.length(1)
    child = buffer.childNodes[0]
    expect(child.nodeName).to.equal('SPAN')
    expect(Object.keys(child.dataset)).to.have.length(0)
    expect(child.textContent).to.equal(expected)

    // Triggered text
    message = 'Hello <@123> there mr. human'
    // Here undefined, because user/channel getters have no content
    expected = 'Hello @undefined there mr. human'
    buffer = $triggers.getLineNodes(message)
    expect(buffer.textContent).to.equal(expected)
    expect(buffer.nodeName).to.equal('P')
    expect(buffer.childNodes).to.have.length(3)

    // First un triggered
    child = buffer.childNodes[0]
    expect(child.nodeName).to.equal('SPAN')
    expect(Object.keys(child.dataset)).to.have.length(0)
    expected = 'Hello '
    expect(child.textContent).to.equal(expected)

    // Second triggered
    child = buffer.childNodes[1]
    expect(child.nodeName).to.equal('SPAN')
    expect(Object.keys(child.dataset)).to.have.length(3)
    expect(child.dataset.triggered).to.equal('true')
    expect(child.dataset.prefix).to.equal('@')
    expect(JSON.parse(child.dataset.meta)).to.deep.equal({ id: '123' })
    expect(child.dataset.invalid).to.equal(undefined)
    expected = '@undefined'
    expect(child.textContent).to.equal(expected)

    // Third un triggered
    child = buffer.childNodes[2]
    expect(child.nodeName).to.equal('SPAN')
    expect(Object.keys(child.dataset)).to.have.length(0)
    expected = ' there mr. human'
    expect(child.textContent).to.equal(expected)
  })

  it('Should be able to get input line nodes (all lines)', () => {
    let wrapper, message

    // Nothing
    message = ''
    wrapper = $triggers.getNodes(message)
    expect(wrapper.childNodes).to.have.length(0)

    // One line
    message = 'human'
    wrapper = $triggers.getNodes(message)
    expect(wrapper.childNodes).to.have.length(1)

    // Multiple lines
    message = 'human is a \nhuman\n'
    wrapper = $triggers.getNodes(message)
    expect(wrapper.childNodes).to.have.length(3)

    // With triggered nodes
    message = 'human is a \nhuman\n<@123><#321>\na <@123>'
    wrapper = $triggers.getNodes(message)
    expect(wrapper.childNodes).to.have.length(4)
  })

  it('Should be able to prepare triggered nodes', () => {
    let node, trigger, text, expected

    // Slash command
    node = document.createElement('span')
    trigger = '/'
    text = 'petpet'
    expected = { trigger: false }
    expect($triggers.prepareTriggeredNode(node, trigger, text)).to.deep.equal(expected)
    expected = '/petpet'
    expect(node.textContent).to.equal(expected)
    expect(node.classList).to.have.length(0)

    // Slash command without text
    node = document.createElement('span')
    trigger = '/'
    text = ''
    expected = { trigger: false }
    expect($triggers.prepareTriggeredNode(node, trigger, text)).to.deep.equal(expected)
    expected = '/'
    expect(node.textContent).to.equal(expected)
    expect(node.classList).to.have.length(0)

    // Other
    node = document.createElement('span')
    trigger = '@'
    text = 'human'
    expected = { trigger: true }
    expect($triggers.prepareTriggeredNode(node, trigger, text)).to.deep.equal(expected)
    expected = '@human'
    expect(node.textContent).to.equal(expected)
    expect(node.classList).to.have.length(1)

    // User tag without text
    node = document.createElement('span')
    trigger = '@'
    text = ''
    expected = { trigger: true }
    expect($triggers.prepareTriggeredNode(node, trigger, text)).to.deep.equal(expected)
    expected = '@'
    expect(node.textContent).to.equal(expected)
    expect(node.classList).to.have.length(1)
  })

  it('Should be able to trigger given node', () => {
    let node, trigger, meta

    // Fresh node
    node = document.createElement('span')
    trigger = '@'
    meta = {}
    $triggers.addNodeTrigger(node, trigger, meta)
    expect(Object.keys(node.dataset)).to.have.length(3)
    expect(node.classList).to.have.length(1)
    expect(node.dataset.triggered).to.equal('true')
    expect(node.dataset.prefix).to.equal(trigger)
    expect(node.dataset.meta).to.equal('{}')

    // Previously invalid node
    node = document.createElement('span')
    node.dataset.invalid = 'true'
    trigger = '@'
    meta = {}
    $triggers.addNodeTrigger(node, trigger, meta)
    expect(Object.keys(node.dataset)).to.have.length(3)
    expect(node.classList).to.have.length(1)
    expect(node.dataset.triggered).to.equal('true')
    expect(node.dataset.prefix).to.equal(trigger)
    expect(node.dataset.meta).to.equal('{}')
    expect(node.dataset.invalid).to.equal(undefined)
  })

  it('Should be able to remove trigger from node', () => {
    let node, trigger, meta

    // Triggered node
    node = document.createElement('span')
    trigger = '@'
    meta = {}
    $triggers.addNodeTrigger(node, trigger, meta)
    $triggers.removeNodeTrigger(node)
    expect(Object.keys(node.dataset)).to.have.length(2)
    expect(node.classList).to.have.length(0)
    expect(node.dataset.triggered).to.equal('true')
    expect(node.dataset.invalid).to.equal('true')

    // Fresh node
    node = document.createElement('span')
    trigger = '@'
    meta = {}
    $triggers.removeNodeTrigger(node)
    expect(Object.keys(node.dataset)).to.have.length(1)
    expect(node.classList).to.have.length(0)
    expect(node.dataset.invalid).to.equal('true')
  })
})
