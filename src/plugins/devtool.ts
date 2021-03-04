import type { Store } from '../Store'

const devtoolHook = typeof __VUE_DEVTOOLS_GLOBAL_HOOK__ === 'undefined' ? undefined : __VUE_DEVTOOLS_GLOBAL_HOOK__

export default function devtoolPlugin<S extends object> (store: Store<S, any>): void {
  if (!devtoolHook) return

  Object.defineProperty(store, '_vm', {
    configurable: true,
    enumerable: false,
    get () {
      return (store as any).__impl.__vm
    },
    set (v) {
      ;(store as any).__impl.__vm = v
      ;(store as any).__impl.data = v._data
    }
  })

  Object.defineProperty(store, '_mutations', {
    configurable: true,
    enumerable: false,
    get () {
      const o = Object.create(null)
      ;(store as any).__mutations.forEach((m: any) => {
        o[m.name] = o[m.name] || []
        o[m.name].push(m.onCommit)
      })
      return o
    }
  })

  ;(store as any)._devtoolHook = devtoolHook

  devtoolHook.emit('vuex:init', store)

  devtoolHook.on('vuex:travel-to-state', (targetState: S) => {
    store.replaceState(targetState)
  })

  store.subscribe((event, state) => {
    if (!('status' in event)) {
      const mutation = event
      devtoolHook.emit('vuex:mutation', mutation, state)
    } else if (event.status === 'before') {
      const action = event
      devtoolHook.emit('vuex:action', action, state)
    }
  }, { prepend: true })
}
