(() => {
  const A = Vue.defineComponent({
    setup () {
      return () => Vue.h('div', null, [store.count])
    }
  })

  const B = Vue.defineComponent({
    setup () {
      return () => Vue.h('div', null, [store.computedCount])
    }
  })

  Vue.createApp(Vue.defineComponent({
    setup () {
      const h = Vue.h
      return () => h(Vue.Fragment, null, [
        h('button', { onClick () {
          store.add()
        } }, ['+']),
        h(A), h(B)
      ])
    }
  })).mount('#app')
})()
