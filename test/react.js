(() => {
  const h = React.createElement
  const A = reactivuety.defineComponent(
    () => () => h('div', null, [store.count])
  )

  const B = reactivuety.defineComponent(
    () => () => h('div', null, [store.computedCount])
  )

  const App = reactivuety.defineComponent(() => {
    return () => h(React.Fragment, { id: 'app' }, [
      h('button', { onClick () {
        store.add()
      } }, ['+']),
      h(A), h(B)
    ])
  })
  
  ReactDOM.render(h(App), document.getElementById('app'))
})()
