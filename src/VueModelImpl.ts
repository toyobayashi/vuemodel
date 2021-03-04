import type { IGettersTree, IVueImpl } from './types'
import { forEach } from './util'

interface IObservedData<T> {
  $$state: T
}

type Getters<S extends object, G extends IGettersTree<S>> = { [K in keyof G]: ReturnType<G[K]> }

export class VueModelImpl<S extends object, G extends IGettersTree<S>> {
  private readonly __Vue: IVueImpl
  private __vm: null | { _data: IObservedData<S>; $destroy (): void }

  public getters!: Getters<S, G>
  public data!: IObservedData<S>

  public constructor (Vue: IVueImpl, state: S, getters?: G) {
    this.__Vue = Vue
    this.__vm = null

    this.resetState(state, getters, false)
  }

  public resetState (state: S, getters?: G, hot?: boolean): void {
    this.getters = Object.create(null)
    if (typeof this.__Vue.reactive === 'function') {
      const oldData = this.data
      const proxy: IObservedData<S> = this.__Vue.reactive({ $$state: state })
      if (getters) {
        forEach(Object.keys(getters), (key) => {
          const computed = this.__Vue.computed!(() => getters[key](proxy.$$state))
          Object.defineProperty(this.getters, key, {
            get: () => computed.value,
            enumerable: true
          })
        })
      }
      this.data = proxy
      if (oldData && hot) {
        oldData.$$state = null!
      }
      return
    }
    const oldVm = this.__vm
    const computed: any = {}

    if (getters) {
      forEach(Object.keys(getters), (key) => {
        computed[key] = () => {
          return getters[key](this.__vm!._data.$$state)
        }
        Object.defineProperty(this.getters, key, {
          get: () => (this.__vm as any)[key],
          enumerable: true
        })
      })
    }

    const VueExtended = this.__Vue.extend!({
      data () {
        return { $$state: state }
      },
      computed
    })
    this.__vm = new VueExtended()

    this.data = this.__vm._data

    if (oldVm != null && hot) {
      oldVm._data.$$state = null!
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.resolve().then(() => {
        oldVm.$destroy()
      })
    }
  }
}
