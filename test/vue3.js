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

  const app = Vue.createApp(Vue.defineComponent({
    setup () {
      const h = Vue.h

      const ref = Vue.ref(null)

      /* Vue.onMounted(() => {
        const button = ref.value
        console.time()
        for (let i = 0; i < 9999; i++) {
          button.click()
        }
        console.timeEnd()
      }) */

      return () => h(Vue.Fragment, null, [
        h('button', { ref: ref, onClick () {
          store.add()
        } }, ['+']),
        h(A), h(B)
      ])
    },
    mounted () {
      console.log(this.$store === store)
    }
  }))
  app.use(store)
  app.mount('#app')
})()
