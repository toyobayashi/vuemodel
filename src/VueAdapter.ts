import type { IGettersTree, IVueImpl, WatchFunction } from './types'
import { forEach } from './util'

interface IObservedData<T> {
  $$state: T
}

export interface IVueAdapter {
  getters: any
  createState<T extends object> (target: IObservedData<T>, getters?: IGettersTree<T>): IObservedData<T>
  watch: WatchFunction
}

export class VueAdapter implements IVueAdapter {
  private readonly __Vue: IVueImpl
  private __vm: null | { $watch: WatchFunction; _data: IObservedData<any> }

  public getters: any = Object.create(null)

  public constructor (Vue: IVueImpl) {
    this.__Vue = Vue
    this.__vm = null
  }

  public createState<T extends object> (target: IObservedData<T>, getters?: IGettersTree<T>): IObservedData<T> {
    if (typeof this.__Vue.reactive === 'function') {
      const proxy: IObservedData<T> = this.__Vue.reactive(target)
      if (getters) {
        forEach(Object.keys(getters), (key) => {
          const computed = this.__Vue.computed!(() => getters[key](proxy.$$state))
          Object.defineProperty(this.getters, key, {
            get: () => computed.value,
            enumerable: true
          })
        })
      }
      return proxy
    }
    const computed: any = {}

    if (getters) {
      forEach(Object.keys(getters), (key) => {
        computed[key] = function (this: { _data: IObservedData<T> }) {
          return getters[key](this._data.$$state)
        }
        Object.defineProperty(this.getters, key, {
          get: () => (this.__vm as any)[key],
          enumerable: true
        })
      })
    }

    const VueExtended = this.__Vue.extend!({
      data () {
        return target
      },
      computed
    })
    this.__vm = new VueExtended()

    return this.__vm._data
  }

  public watch<T>(source: T | (() => T), cb: (value: T, ...args: any[]) => any, options?: {
    immediate?: boolean
    deep?: boolean
    [x: string]: any
  }): () => void {
    if (typeof this.__Vue.watch === 'function') {
      return this.__Vue.watch(source, cb, options)
    }
    if (!this.__vm) throw new Error('Invalid vue instance')
    return this.__vm.$watch(source, cb, options)
  }
}
