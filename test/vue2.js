(() => {
  const A = Vue.extend({
    render (h) {
      return h('div', null, [store.count])
    }
  })

  const B = Vue.extend({
    render (h) {
      return h('div', null, [store.computedCount])
    }
  })

  new Vue({
    render: (h) => {
      return h('div', { attrs: { id: 'app' } }, [
        h('button', { on: { click () {
          store.add()
        } } }, ['+']),
        h(A), h(B)
      ])
    }
  }).$mount('#app')
})()
