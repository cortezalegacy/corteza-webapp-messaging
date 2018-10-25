// Event bus
//
// What kind of problems should event bus solve:
//  - sibling component communication
//  - communication layer to component communication (websocket comm handling -- hooking on received payloads)
//
// What kind of problems it should NOT solve:
//  - passing data that will be rendered, use state for that
//  - passing data to child components, use props
//  - passing data to parent compoents, use event system on base Vue instance ($emit, <... @...="...">
//
// Rules to follow:
//
// Event name MUST be prefixed. Use name of the origin, ie:
//  - [plugins] $ws.message
//  - [components] Component/Path/And/Name.eventName
//  - [views] /ViewName.eventName

export default {
  install (Vue, { eventbus }) {
    if (eventbus === undefined || eventbus.$emit === undefined) {
      throw Error('Expecting eventbus to be passed as an option to bus plugin')
    }

    Vue.prototype.$bus = eventbus
  },
}
