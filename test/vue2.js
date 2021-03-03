(() => {
  Vue.use(store)

  const A = Vue.extend({
    render (h) {
      return h('div', null, [this.$store.count])
    }
  })

  const B = Vue.extend({
    render (h) {
      return h('div', null, [this.$store.computedCount])
    }
  })

  const vm = new Vue({
    render (h) {
      return h('div', { attrs: { id: 'app' } }, [
        h('button', { ref: 'button', on: { click: () => {
          this.$store.add()
        } } }, ['+']),
        h(A), h(B)
      ])
    },
    mounted () {
      /* const button = this.$refs.button
      console.time()
      for (let i = 0; i < 9999; i++) {
        button.click()
      }
      console.timeEnd() */
    }
  })
  vm.$mount('#app')
  console.log(vm.$store === store)
})()
