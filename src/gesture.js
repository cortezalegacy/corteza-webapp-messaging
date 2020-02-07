import Vue from 'vue'
import AlloyFinger from 'alloyfinger'

const target = document.getElementsByTagName('BODY')[0]
const emitGesture = (e) => {
  Vue.prototype.$bus.$emit(`gesture:${e.type}`, { e, clientWidth: target.clientWidth })
}

/* eslint-disable no-unused-vars */
const af = new AlloyFinger(target, {
  touchStart: emitGesture,
  touchMove: emitGesture,
  touchEnd: emitGesture,
})
