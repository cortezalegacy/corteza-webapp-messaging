/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import InputRichText from '@/components/Channel/InputRichText'
import triggers from '@/plugins/triggers'

let localVue = createLocalVue()
localVue.use(triggers, {
  userByID: () => { return {} },
  channelByID: () => { return {} },
})

let wrapper

describe('InputRichText.vue', () => {
  beforeEach(() => {
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: {
        inputName: 'richInput'
      },
    })
  })
  it('Node process should be able to handle these edge cases', () => {
    // Empty input...
    let node = document.createElement('div')

    wrapper.vm.processTriggeredText(node)
    let event = wrapper.emitted().msgUpdate.pop().pop()
    let expectedEvent = { msg: '' }
    expect(wrapper.vm.value).to.equal('')
    expect(event).to.deep.equal(expectedEvent)

    wrapper.vm.processTriggeredText(node)
    event = wrapper.emitted().msgUpdate.pop().pop()
    expectedEvent = { msg: '' }
    expect(wrapper.vm.value).to.equal('')
    expect(event).to.deep.equal(expectedEvent)

    // Empty line
    node = document.createElement('div')
    let line = document.createElement('p')
    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal('\n')

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal('\n')

    // Empty lines
    node = document.createElement('div')
    line = document.createElement('p')
    node.appendChild(line)
    line = document.createElement('p')
    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal('\n\n')

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal('\n\n')
  })

  it('Text process should be able to process regular nodes', () => {
    let node, line, chunk, textNode, expected

    // 1 chunk
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    textNode = document.createTextNode('regular1')
    expected = 'regular1\n'

    chunk.appendChild(textNode)
    line.appendChild(chunk)
    node.appendChild(line)
    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    // 2 chunks
    expected = 'regular1regular2\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    textNode = document.createTextNode('regular1')

    chunk.appendChild(textNode)
    line.appendChild(chunk)

    chunk = document.createElement('span')
    textNode = document.createTextNode('regular2')
    chunk.appendChild(textNode)
    line.appendChild(chunk)


    node.appendChild(line)
    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    // Multiple chunks in multiple lines
    expected = 'regular1\nregular2regular3\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    textNode = document.createTextNode('regular1')

    chunk.appendChild(textNode)
    line.appendChild(chunk)
    node.appendChild(line)

    line = document.createElement('p')
    chunk = document.createElement('span')
    textNode = document.createTextNode('regular2')
    chunk.appendChild(textNode)
    line.appendChild(chunk)

    chunk = document.createElement('span')
    textNode = document.createTextNode('regular3')
    chunk.appendChild(textNode)
    line.appendChild(chunk)


    node.appendChild(line)
    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)
  })

  it('Text process should be able to process triggered nodes', () => {
    let node, line, chunk, trigger, text, meta, expected

    // 1 triggered node
    expected = '<@id1>\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '@'
    text = 'human'
    meta = { id: 'id1' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)

    line.appendChild(chunk)
    node.appendChild(line)
    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    // Multiple triggered nodes
    expected = '<@id1>\n<#id2><@id3>\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '@'
    text = 'human'
    meta = { id: 'id1' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    line.appendChild(chunk)
    node.appendChild(line)

    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '#'
    text = 'cat'
    meta = { id: 'id2' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    line.appendChild(chunk)

    chunk = document.createElement('span')
    trigger = '@'
    text = 'fruit'
    meta = { id: 'id3' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    line.appendChild(chunk)
    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    // Slash command followed by triggers
    expected = '\\bleh<@id1>\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '\\'
    text = 'bleh'

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    line.appendChild(chunk)

    chunk = document.createElement('span')
    trigger = '@'
    text = 'human'
    meta = { id: 'id1' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    line.appendChild(chunk)

    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)
  })

  it('Text process should be able to ignore invalid triggered nodes while processing', () => {
    let node, line, chunk, trigger, text, meta, expected

    // 1 triggered node; 1 invalid
    expected = '@human\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '@'
    text = 'human'
    meta = { id: 'id1' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    wrapper.vm.$triggers.removeNodeTrigger(chunk)

    line.appendChild(chunk)
    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    // n triggered node; 1 invalid
    expected = '@human\n<@id2>#cookie\n'
    node = document.createElement('div')
    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '@'
    text = 'human'
    meta = { id: 'id1' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    wrapper.vm.$triggers.removeNodeTrigger(chunk)
    line.appendChild(chunk)
    node.appendChild(line)

    line = document.createElement('p')
    chunk = document.createElement('span')
    trigger = '@'
    text = 'cat'
    meta = { id: 'id2' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    line.appendChild(chunk)

    chunk = document.createElement('span')
    trigger = '#'
    text = 'cookie'
    meta = { id: 'id3' }

    wrapper.vm.$triggers.prepareTriggeredNode(chunk, trigger, text)
    wrapper.vm.$triggers.addNodeTrigger(chunk, trigger, meta)
    wrapper.vm.$triggers.removeNodeTrigger(chunk)
    line.appendChild(chunk)
    node.appendChild(line)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)

    wrapper.vm.processTriggeredText(node)
    expect(wrapper.vm.value).to.equal(expected)
  })

  it('Should be able to check if chunk is invoking a trigger', () => {
    let chunk, expected

    // No text
    chunk = { msg: '' }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)

    // Non triggering
    chunk = { msg: 'humans' }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)

    // Trigger -- invalid constraints
    chunk = { msg: '/petpet' }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal(false)

    // Trigger -- ok constraints
    chunk = { msg: '/petpet', index: 0 }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('/')
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('/')

    // User/channel tag
    chunk = { msg: '@human' }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('@')
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('@')

    chunk = { msg: '#hello' }
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('#')
    expect(wrapper.vm.getInvokingTrigger(chunk)).to.equal('#')
  })

  it('Should be able to add trigger based on sugestion', () => {
    let node, suggestion, expected

    // No suggestion
    node = document.createElement('span')
    wrapper.vm.addNodeTrigger(node)
    expect(node.dataset.triggered).to.equal(undefined)

    // Empty suggestion
    node = document.createElement('span')
    suggestion = {}
    wrapper.vm.addNodeTrigger(node, suggestion)
    expect(node.dataset.triggered).to.equal('true')
    expect(JSON.parse(node.dataset.meta)).to.deep.eq({})

    // Empty meta in suggestion
    node = document.createElement('span')
    suggestion = { command: {} }
    wrapper.vm.addNodeTrigger(node, suggestion)
    expect(node.dataset.triggered).to.equal('true')
    expect(JSON.parse(node.dataset.meta)).to.deep.eq({})

    // Some meta in suggestion
    node = document.createElement('span')
    suggestion = { command: { meta: { id: 'id1' } } }
    expected = { id: 'id1' }
    wrapper.vm.addNodeTrigger(node, suggestion)
    expect(node.dataset.triggered).to.equal('true')
    expect(JSON.parse(node.dataset.meta)).to.deep.eq(expected)
  })

  it('Should be able to extract suggestions', () => {
    let expected, suggestion

    // No input
    expected = { prefix: undefined, meta: {}, command: undefined }
    expect(wrapper.vm.extractSuggestion()).to.deep.eq(expected)
    expect(wrapper.vm.extractSuggestion()).to.deep.eq(expected)

    // Partial input
    suggestion = { command: {} }
    expected = { prefix: undefined, meta: {}, command: undefined }
    expect(wrapper.vm.extractSuggestion(suggestion)).to.deep.eq(expected)
    expect(wrapper.vm.extractSuggestion(suggestion)).to.deep.eq(expected)

    suggestion = { command: { meta: { id: 'a' } } }
    expected = { prefix: undefined, meta: { id: 'a' }, command: undefined }
    expect(wrapper.vm.extractSuggestion(suggestion)).to.deep.eq(expected)
    expect(wrapper.vm.extractSuggestion(suggestion)).to.deep.eq(expected)
  })

  it('Should be able to tell if trigger from suggestions is valid', () => {
    let suggestions

    // No input
    expect(wrapper.vm.isTriggerValid()).to.eq(false)
    expect(wrapper.vm.isTriggerValid()).to.eq(false)

    // To many
    suggestions = [{}, {}]
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(false)
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(false)

    suggestions = [{}, {}, {}, {}]
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(false)
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(false)

    // Enaugh
    suggestions = [{}]
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(true)
    expect(wrapper.vm.isTriggerValid(suggestions)).to.eq(true)
  })

  it('Should allow a triggered node to be inserted from outside', () => {
    let lastNode, suggestion, expected

    let prepareEnv = () => {
      let parent = document.createElement('div')
      let child = document.createElement('span')

      parent.appendChild(child)

      wrapper.vm.$set(wrapper.vm, 'lastNode', child)
      return parent
    }

    // No suggestion
    lastNode = prepareEnv()
    expect(wrapper.vm.insertTriggeredNode()).to.eq(false)
    expect(wrapper.vm.insertTriggeredNode()).to.eq(false)

    // Extra trigger params (@#)
    suggestion = { prefix: '@', command: { command: 'human' } }
    lastNode = prepareEnv()
    expected = ' '
    wrapper.vm.insertTriggeredNode(suggestion)
    
    expect(lastNode.childNodes).to.have.length(2)
    let [ triggered, regular ] = lastNode.childNodes
    expect(triggered.nodeName).to.eq('SPAN')
    expect(triggered.dataset.triggered).to.equal('true')
    expect(regular.nodeName).to.eq('SPAN')
    expect(regular.dataset.triggered).to.equal(undefined)
    expect(regular.textContent).to.equal(expected)

    // No extra param trigger (/)
    suggestion = { prefix: '/', command: { command: 'petpet' } }
    lastNode = prepareEnv()
    wrapper.vm.insertTriggeredNode(suggestion)
    
    expect(lastNode.childNodes).to.have.length(2)
    let [ regular1, regular2 ] = lastNode.childNodes
    expect(regular1.nodeName).to.eq('SPAN')
    expect(regular.dataset.triggered).to.equal(undefined)
    expected = '/petpet'
    expect(regular1.textContent).to.equal(expected)

    expect(regular2.nodeName).to.eq('SPAN')
    expect(regular.dataset.triggered).to.equal(undefined)
    expected = ' '
    expect(regular2.textContent).to.equal(expected)
  })

  it('Should be able to get richInput node', () => {
    let richInput

    richInput = wrapper.vm.textAreaRef()
    expect(richInput.dataset.nodetype).to.eq('root')
    expect(richInput.id).to.eq('richInput')
  })

  it('Should be able to set node structure to given value', () => {
    let richInput, value, expected

    // No value -- clear it
    expected = ''
    richInput = wrapper.vm.textAreaRef()
    wrapper.vm.setValue()
    expect(richInput.textContent).to.eq(expected)

    // Regular text
    value = expected = 'hello there'
    wrapper.vm.setValue(value)
    expect(richInput.textContent).to.eq(expected)

    // Triggered text
    value = 'hello there <@123>'
    expected = 'hello there @undefined'
    wrapper.vm.setValue(value)
    expect(richInput.textContent).to.eq(expected)
  })

  it('Should be able to get current node', () => {
    let lastNode

    // Use last node
    lastNode = document.createElement('span')
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    expect(wrapper.vm.getCurentNode().nodeName).to.eq(lastNode.nodeName)

    // Skip the rest for now -- don't think it is supported in JSDOM
  })

  it('Expand above assertion')

  it('Should be able to get current chunk (where caret is)', () => {
    let lastNode, msg, cursorIndex, expected
    
    // Inside root
    lastNode = document.createElement('div')
    lastNode.dataset.nodetype = 'root'
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    expected = { index: 0, first: 0, last: 0, msg: '' }
    expect(wrapper.vm.getCurentChunk()).to.deep.eq(expected)

    // Inside a triggered node
    lastNode = document.createElement('span')
    expected = '@human'
    lastNode.appendChild(document.createTextNode(expected))
    lastNode.dataset.triggered = true
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    expected = { index: 0, first: 0, last: expected.length, msg: expected }
    expect(wrapper.vm.getCurentChunk()).to.deep.eq(expected)

    // Inside regular text - middle of chunk
    lastNode = document.createElement('span')
    msg = 'hello bananas here'
    lastNode.appendChild(document.createTextNode(expected))
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    cursorIndex = 7 // after b
    expected = { index: 6, first: 6, last: 6 + 'bananas'.length, msg: 'bananas' }

    expect(wrapper.vm.getCurentChunk(msg, cursorIndex)).to.deep.eq(expected)

    // Inside regular text - start of chunk
    lastNode = document.createElement('span')
    msg = 'hello bananas here'
    lastNode.appendChild(document.createTextNode(expected))
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    cursorIndex = 6 // before b
    expected = { index: 6, first: 6, last: 6 + 'bananas'.length, msg: 'bananas' }

    expect(wrapper.vm.getCurentChunk(msg, cursorIndex)).to.deep.eq(expected)

    // At the end of word
    lastNode = document.createElement('span')
    msg = 'a '
    lastNode.appendChild(document.createTextNode(expected))
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    cursorIndex = 2 // At end of word
    expected = { index: 2, first: 2, last: 2, msg: '' }

    expect(wrapper.vm.getCurentChunk(msg, cursorIndex)).to.deep.eq(expected)
  })

  it('Should be able to get available suggestions', () => {
    let tsMeta

    // On init
    expect(wrapper.vm.getSuggestions).to.have.length(0)
    expect(wrapper.vm.getSuggestions).to.have.length(0)

    // Empty suggestion
    tsMeta = {}
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.getSuggestions).to.have.length(0)
    expect(wrapper.vm.getSuggestions).to.have.length(0)

    // Some suggestions
    tsMeta = { suggestions: [{}, {}] }
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.getSuggestions).to.have.length(2)
    expect(wrapper.vm.getSuggestions).to.have.length(2)
  })

  it('Should be able to tell if suggestions are opened', () => {
    let tsMeta

    // On init
    expect(wrapper.vm.suggestionsOpened).to.eq(false)
    expect(wrapper.vm.suggestionsOpened).to.eq(false)

    // Empty suggestion
    tsMeta = {}
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.suggestionsOpened).to.eq(false)
    expect(wrapper.vm.suggestionsOpened).to.eq(false)

    // Some suggestions
    tsMeta = { opened: true }
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.suggestionsOpened).to.eq(true)
    expect(wrapper.vm.suggestionsOpened).to.eq(true)
  })

  it('Should be able to tell if spaces are allowed in trigger params', () => {
    let tsMeta, lastNode

    // No suggestions
    expect(wrapper.vm.allowSpace).to.eq(false)
    expect(wrapper.vm.allowSpace).to.eq(false)

    // Suggestion with no spaces
    tsMeta = { suggestions: [{ command: { command: 'huehue' } }] }
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.allowSpace).to.eq(false)
    expect(wrapper.vm.allowSpace).to.eq(false)

    // Suggestion with spaces - input not yet matching
    tsMeta = { suggestions: [{ command: { command: 'huehue we' } }] }
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('@hueh'))
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)

    expect(wrapper.vm.allowSpace).to.eq(true)
    expect(wrapper.vm.allowSpace).to.eq(true)

    // Suggestion with spaces - input matching
    tsMeta = { suggestions: [{ command: { command: 'huehue we' } }] }
    wrapper = wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('@huehue we'))
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)

    expect(wrapper.vm.allowSpace).to.eq(false)
    expect(wrapper.vm.allowSpace).to.eq(false)
  })

  

  it('Should be able to process inputs nodes', () => {
    let selection, node, lastNode, nodeCaretIndex, tsMeta, parent, expected

    // Breaks at first return, due to invalid params
    node = {}
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)

    nodeCaretIndex = -1
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)

    node = { textContent: 'hello' }
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)
    expect(wrapper.vm.processNodes(node, nodeCaretIndex)).to.eq(false)


    // Inserts new node
    tsMeta = { suggestions: [{ command: { command: 'huehue we' } }] }
    nodeCaretIndex = 0
    wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    parent = document.createElement('div')
    lastNode = document.createElement('span')
    lastNode.dataset.triggered = true
    lastNode.appendChild(document.createTextNode('@huehue we '))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expect(parent.childNodes.length).to.eq(2)
    
    //// First is trimmed trigger...
    expected = '@huehue we'
    expect(lastNode.textContent).to.eq(expected)

    //// Second is node with a space
    expected = ' '
    expect(parent.childNodes[1].textContent).to.eq(expected)

    // Inserts new node - keeps old nodes intact
    tsMeta = { suggestions: [{ command: { command: 'huehue we' } }] }
    nodeCaretIndex = 0
    wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    parent = document.createElement('div')
    parent.appendChild(document.createElement('p'))
    parent.appendChild(document.createElement('p'))

    lastNode = document.createElement('span')
    lastNode.dataset.triggered = true
    lastNode.appendChild(document.createTextNode('@huehue we '))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expect(parent.childNodes.length).to.eq(4)
    let [ p1, p2, triggered, lastChild ] = parent.childNodes
    
    //// First is trimmed trigger...
    expected = '@huehue we'
    expect(triggered.textContent).to.eq(expected)

    //// Second is node with a space
    expected = ' '
    expect(lastChild.textContent).to.eq(expected)

    //// First 2 are p's
    for (let p of [p1, p2]) expect(p.nodeName).to.eq('P')
  })

  it('processNodes - Should join regular nodes', () => {
    // Doesn't support createRange
    return
    // let selection, lastNode, nextSibling, nodeCaretIndex, parent, expected
    // nodeCaretIndex = 0

    // // Just 2 nodes - no spaces
    // parent = document.createElement('div')
    // lastNode = document.createElement('span')
    // lastNode.appendChild(document.createTextNode('pt1'))
    // parent.appendChild(lastNode)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt2'))
    // parent.appendChild(nextSibling)

    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    // expect(parent.childNodes.length).to.eq(2)

    // wrapper.vm.processNodes(lastNode, nodeCaretIndex)
    // expect(parent.childNodes.length).to.eq(1)

    // expected = 'pt1pt2'
    // expect(lastNode.textContent).to.eq(expected)

    // // Just 2 nodes - with spaces
    // parent = document.createElement('div')
    // lastNode = document.createElement('span')
    // lastNode.appendChild(document.createTextNode('pt 1  '))
    // parent.appendChild(lastNode)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('p t2 '))
    // parent.appendChild(nextSibling)

    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    // expect(parent.childNodes.length).to.eq(2)

    // wrapper.vm.processNodes(lastNode, nodeCaretIndex)
    // expect(parent.childNodes.length).to.eq(1)

    // expected = 'pt 1  p t2 '
    // expect(lastNode.textContent).to.eq(expected)

    // // Some nodes -- mixed with triggered ones - no merges
    // parent = document.createElement('div')
    // lastNode = document.createElement('span')
    // lastNode.appendChild(document.createTextNode('pt1'))
    // parent.appendChild(lastNode)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt2t'))
    // nextSibling.dataset.triggered = true
    // parent.appendChild(nextSibling)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt3'))
    // parent.appendChild(nextSibling)

    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    // expect(parent.childNodes.length).to.eq(3)

    // wrapper.vm.processNodes(lastNode, nodeCaretIndex)
    // expect(parent.childNodes.length).to.eq(3)

    // expected = 'pt1'
    // expect(lastNode.textContent).to.eq(expected)

    // expected = 'pt2t'
    // expect(lastNode.nextElementSibling.textContent).to.eq(expected)
    // expect(lastNode.nextElementSibling.dataset.triggered).to.eq('true')

    // expected = 'pt3'
    // expect(lastNode.nextElementSibling.nextElementSibling.textContent).to.eq(expected)

    // // Some nodes -- mixed with triggered ones - last 2 merge
    // parent = document.createElement('div')
    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt1'))
    // parent.appendChild(nextSibling)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt2t'))
    // nextSibling.dataset.triggered = true
    // parent.appendChild(nextSibling)

    // lastNode = document.createElement('span')
    // lastNode.appendChild(document.createTextNode('pt3'))
    // parent.appendChild(lastNode)

    // nextSibling = document.createElement('span')
    // nextSibling.appendChild(document.createTextNode('pt4'))
    // parent.appendChild(nextSibling)

    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    // expect(parent.childNodes.length).to.eq(4)

    // wrapper.vm.processNodes(lastNode, nodeCaretIndex)
    // expect(parent.childNodes.length).to.eq(3)

    // expected = 'pt1'
    // expect(parent.firstChild.textContent).to.eq(expected)

    // expected = 'pt2t'
    // expect(parent.firstChild.nextElementSibling.textContent).to.eq(expected)
    // expect(parent.firstChild.nextElementSibling.dataset.triggered).to.eq('true')

    // expected = 'pt3pt4'
    // expect(lastNode.textContent).to.eq(expected)
  })

  it('processNodes - Should split up nodes to create triggers', () => {
    let selection, lastNode, nextSibling, nodeCaretIndex, parent, expected
    nodeCaretIndex = 1

    // Just one triggered word - no splitting
    parent = document.createElement('div')
    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('@pt1'))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expected = '@pt1'
    expect(parent.childNodes.length).to.eq(1)
    expect(lastNode.dataset.triggered).to.eq('true')
    expect(lastNode.dataset.invalid).to.eq('true')
    expect(lastNode.textContent).to.eq(expected)

    // Triggered word with right regular text - right split
    parent = document.createElement('div')
    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('@pt1 and here heh'))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expected = '@pt1'
    expect(parent.childNodes.length).to.eq(2)
    expect(lastNode.dataset.triggered).to.eq('true')
    expect(lastNode.dataset.invalid).to.eq('true')
    expect(lastNode.textContent).to.eq(expected)

    lastNode = lastNode.nextElementSibling
    expected = ' and here heh'
    expect(lastNode.dataset.triggered).to.eq(undefined)
    expect(lastNode.dataset.invalid).to.eq(undefined)
    expect(lastNode.textContent).to.eq(expected)

    // Triggered word with left & right regular text - right & left split
    nodeCaretIndex = 10
    parent = document.createElement('div')
    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('he he he @pt1 and here heh'))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expected = '@pt1'
    expect(parent.childNodes.length).to.eq(3)

    expect(lastNode.dataset.triggered).to.eq('true')
    expect(lastNode.dataset.invalid).to.eq('true')
    expect(lastNode.textContent).to.eq(expected)

    lastNode = lastNode.nextElementSibling
    expected = ' and here heh'
    expect(lastNode.dataset.triggered).to.eq(undefined)
    expect(lastNode.dataset.invalid).to.eq(undefined)
    expect(lastNode.textContent).to.eq(expected)

    // Go back 2x; previous is triggered one
    lastNode = lastNode.previousSibling.previousSibling
    expected = 'he he he '
    expect(lastNode.dataset.triggered).to.eq(undefined)
    expect(lastNode.dataset.invalid).to.eq(undefined)
    expect(lastNode.textContent).to.eq(expected)

    // Should just skip / triggers
    nodeCaretIndex = 1
    parent = document.createElement('div')
    lastNode = document.createElement('span')
    lastNode.appendChild(document.createTextNode('/petpet hello'))
    parent.appendChild(lastNode)
    wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)
    wrapper.vm.processNodes(lastNode, nodeCaretIndex)

    expected = '/petpet hello'
    expect(parent.childNodes.length).to.eq(1)

    expect(lastNode.dataset.triggered).to.eq(undefined)
    expect(lastNode.dataset.invalid).to.eq(undefined)
    expect(lastNode.textContent).to.eq(expected)
  })

  it('Should be able to addNodeTrigger based on suggestion', () => {
    let node, suggestion

    // No suggestion
    expect(wrapper.vm.addNodeTrigger(node)).to.eq(false)
    expect(wrapper.vm.addNodeTrigger(node)).to.eq(false)

    // Empty suggestion
    node = document.createElement('span')
    suggestion = {}
    wrapper.vm.addNodeTrigger(node, suggestion)
    expect(node.dataset.triggered).to.eq('true')

    // Deeper testing in plugin's spec. Will omit here
  })

  it('updateValue - edit last', () => {
    let e, value, event, expected

    // Edit last command
    value = ''
    e = { which: 38 }
    wrapper.vm.$set(wrapper.vm, 'value', value)
    expect(wrapper.emitted().editLastMessage).to.eq(undefined)
    expected = 'EDIT_LAST'
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    event = wrapper.emitted().editLastMessage.pop().pop()
    expected = {}
    expect(event).to.deep.eq(expected)

    delete wrapper.emitted().editLastMessage
    value = ' '
    e = { which: 38 }
    wrapper.vm.$set(wrapper.vm, 'value', value)
    expect(wrapper.emitted().editLastMessage).to.eq(undefined)
    expected = 'EDIT_LAST'
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    event = wrapper.emitted().editLastMessage.pop().pop()
    expected = {}
    expect(event).to.deep.eq(expected)

    delete wrapper.emitted().editLastMessage
    value = '\n'
    e = { which: 38 }
    wrapper.vm.$set(wrapper.vm, 'value', value)
    expect(wrapper.emitted().editLastMessage).to.eq(undefined)
    expected = 'EDIT_LAST'
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    event = wrapper.emitted().editLastMessage.pop().pop()
    expected = {}
    expect(event).to.deep.eq(expected)
  })

  it('Should be able to reset input', () => {
    let value

    wrapper.vm.setValue()
    expect(wrapper.vm.textAreaRef().innerHTML).to.eq(wrapper.vm.getInitialDom().wrapper.outerHTML)

    // Clear input with text
    value = 'here be me'
    wrapper.vm.setValue(value)
    wrapper.vm.$set(wrapper.vm, 'value', value)
    expect(wrapper.vm.textAreaRef().innerHTML).to.not.eq(wrapper.vm.getInitialDom().wrapper.outerHTML)

    wrapper.vm.resetInput()
    expect(wrapper.vm.textAreaRef().innerHTML).to.eq(wrapper.vm.getInitialDom().wrapper.outerHTML)
  })

  it('updateValue - submit', () => {
    let e, value, event, tsMeta, expected, ignoreNextSubmit

    // Submit ignored
    ignoreNextSubmit = true
    value = 'some value'
    e = { which: 13 }
    wrapper.vm.$set(wrapper.vm, 'value', value)
    wrapper.vm.$set(wrapper.vm, 'ignoreNextSubmit', ignoreNextSubmit)
    expected = 'IGNORED'
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    expect(wrapper.vm.ignoreNextSubmit).to.eq(!ignoreNextSubmit)

    // Suggestions pannel opened
    tsMeta = { opened: true }
    expected = 'SUGGESTIONS_OPENED'
    wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput', tsMeta },
    })

    expect(wrapper.vm.updateValue(e)).to.eq(expected)

    // Should submit if shift is not held
    wrapper = shallowMount(InputRichText, {
      localVue,
      propsData: { inputName: 'richInput' },
    })

    value = ' some value '
    e = { which: 13 }
    wrapper.vm.$set(wrapper.vm, 'value', value)
    expected = 'SUBMIT'
    expect(wrapper.emitted().submit).to.eq(undefined)
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    expected = { value: value.trim() }
    event = wrapper.emitted().submit.pop().pop()
    expect(event).to.deep.eq(expected)
  })

  it('updateValue - reset input', () => {
    let e, expected

    wrapper.vm.resetInput()

    // Submit ignored
    e = {}
    expect(wrapper.vm.textAreaRef().innerHTML).to.eq(wrapper.vm.getInitialDom().wrapper.outerHTML)
    wrapper.vm.textAreaRef().innerHTML = ''
    expected = ''
    expect(wrapper.vm.textAreaRef().innerHTML).to.eq(expected)
    expected = 'DELETED'
    expect(wrapper.vm.updateValue(e)).to.eq(expected)
    expect(wrapper.vm.textAreaRef().innerHTML).to.eq(wrapper.vm.getInitialDom().wrapper.outerHTML)
  })

  it('updateValue - ignore keyboard event')

  it('Should be able to create new lines')
    // let e, lastNode, parent, buffer
    // e = { which: 13, shiftKey: true, preventDefault: () => {} }

    // // On empty line
    // buffer = document.createElement('p')
    // buffer.dataset.old = true
    // lastNode = document.createElement('span')
    // buffer.appendChild(lastNode)
    // parent = document.createElement('div')
    // parent.appendChild(buffer)
    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)

    // expect(parent.childNodes.length).to.eq(1)

    // wrapper.vm.handleLines(e)
    // expect(parent.childNodes.length).to.eq(2)

    // let [oldN, newN] = parent.childNodes
    // expect(oldN.dataset.old).to.eq('true')

    // expect(newN.dataset.old).to.eq(undefined)
    // expect(newN.childNodes.length).to.eq(1)
    // expect(newN.childNodes[0].childNodes.length).to.eq(1)

    // // Should work if curent node is line
    // lastNode = document.createElement('p')
    // lastNode.dataset.old = true
    // parent = document.createElement('div')
    // parent.appendChild(lastNode)
    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)

    // expect(parent.childNodes.length).to.eq(1)

    // wrapper.vm.handleLines(e)
    // expect(parent.childNodes.length).to.eq(2)

    // // Should be able to insert between lines
    // lastNode = document.createElement('p')
    // lastNode.dataset.old = true

    // buffer = document.createElement('p')
    // buffer.dataset.old = true

    // parent = document.createElement('div')
    // parent.appendChild(lastNode)
    // parent.appendChild(buffer)
    // wrapper.vm.$set(wrapper.vm, 'lastNode', lastNode)

    // expect(parent.childNodes.length).to.eq(2)

    // wrapper.vm.handleLines(e)
    // expect(parent.childNodes.length).to.eq(3)

    // let [ oldN1, newN1, oldN2 ] = parent.childNodes
    // for (let n of [ oldN1, oldN2 ]) expect(n.dataset.old).to.eq('true')
    // expect(newN1.dataset.old).to.eq(undefined)
  // })
})
