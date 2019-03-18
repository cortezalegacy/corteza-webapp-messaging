import Vue from 'vue'
import AlloyFinger from 'alloyfinger'

const emitGesture = (ev) => {
  Vue.prototype.$bus.$emit(`gesture:${ev.type}`, ev)
}

/* eslint-disable no-unused-vars */
let af = new AlloyFinger(document.getElementsByTagName('BODY')[0], {
  touchStart: emitGesture,
  touchMove: emitGesture,
  touchEnd: emitGesture,
})
