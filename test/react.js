(() => {
  const h = React.createElement
  const A = reactivuety.defineComponent(
    () => () => h('div', null, [store.count])
  )

  const B = reactivuety.defineComponent(
    () => () => h('div', null, [store.computedCount])
  )

  const App = reactivuety.defineComponent(() => {
    const ref = reactivuety.ref(null)

    reactivuety.onMounted(() => {
      const button = ref.value
      console.time()
      for (let i = 0; i < 9999; i++) {
        button.click()
      }
      console.timeEnd()
    })

    return () => h(React.Fragment, { id: 'app' }, [
      h('button', { ref: ref, onClick () {
        store.add()
      } }, ['+']),
      h(A), h(B)
    ])
  })
  
  ReactDOM.render(h(App), document.getElementById('app'))
})()
