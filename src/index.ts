/** @public */
export type Subscriber<S extends object> = (state: S) => void

/** @public */
export interface SubscribeOptions {
  prepend?: boolean
}

/** @public */
export interface GettersTree<S extends object> {
  [x: string]: (state: S) => any
}

/** @public */
export interface IVueModel<S extends object, G extends GettersTree<S>> {
  readonly state: S
  readonly getters: { [K in keyof G]: ReturnType<G[K]> }
  subscribe (fn: Subscriber<S>, options?: SubscribeOptions): () => void
}

interface IVueModelAdapter {
  getters: any
  createState<T extends object> (target: { $$state: T }, getters?: GettersTree<T>): any
  watch<T extends object>(source: T, cb: (value: T, ...args: any[]) => any, options?: {
    immediate?: boolean
    deep?: boolean
    [x: string]: any
  }): () => void
}

/** @public */
export interface IVue {
  reactive?: Function
  computed?: Function
  watch?: Function
  extend?: (options: any) => new () => { $watch: Function; _data: any; [x: string]: any }
  [x: string]: any
}

class VueAdapter implements IVueModelAdapter {
  private readonly __Vue: IVue
  private __vm: null | { $watch: Function; _data: any }

  public getters: any = Object.create(null)

  public constructor (Vue: IVue) {
    this.__Vue = Vue
    this.__vm = null
  }

  public createState<T extends object> (target: { $$state: T }, getters?: GettersTree<T>): any {
    if (typeof this.__Vue.reactive === 'function') {
      const proxy: { $$state: T } = this.__Vue.reactive(target)
      if (getters) {
        const getterKeys = Object.keys(getters)
        for (let i = 0; i < getterKeys.length; i++) {
          const key = getterKeys[i]
          const computed = this.__Vue.computed!(() => getters[key](proxy.$$state))
          Object.defineProperty(this.getters, key, {
            get: () => computed.value,
            enumerable: true
          })
        }
      }
      return proxy
    }
    const computed: any = {}

    if (getters) {
      const getterKeys = Object.keys(getters)
      for (let i = 0; i < getterKeys.length; i++) {
        const key = getterKeys[i]
        computed[key] = (function () {
          return function (this: { _data: { $$state: T } }) {
            return getters[key](this._data.$$state)
          }
        })()
        Object.defineProperty(this.getters, key, {
          get: () => {
            return (this.__vm as any)[key]
          },
          enumerable: true
        })
      }
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

  public watch<T extends object>(source: T, cb: (value: T, ...args: any[]) => any, options?: {
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

// function partial<T> (fn: (arg: T) => any, arg: T): () => any {
//   return function () {
//     return fn(arg)
//   }
// }

/** @public */
export interface VueModelOptions<S extends object, G extends GettersTree<S>> {
  state: S
  getters?: G
}

/** @public */
export class VueModel<S extends object, G extends GettersTree<S>> implements IVueModel<S, G> {
  public static extend (Vue: IVue): new<S extends object, G extends GettersTree<S>> (options: VueModelOptions<S, G>) => IVueModel<S, G> {
    return class <S extends object, G extends GettersTree<S>> extends VueModel<S, G> {
      public constructor (options: VueModelOptions<S, G>) {
        super(Vue, options)
      }
    }
  }

  public static create<S extends object, G extends GettersTree<S>> (Vue: IVue, options: VueModelOptions<S, G>): VueModel<S, G> {
    return new VueModel(Vue, options)
  }

  protected _state: { $$state: S }

  private readonly __subscribers: Array<Subscriber<S>>

  // @ts-expect-error
  private __watchStopHandle: null | (() => void)

  private readonly __adapter: IVueModelAdapter

  public constructor (Vue: IVue, options: VueModelOptions<S, G>) {
    const { state, getters } = options
    this.__adapter = new VueAdapter(Vue)
    this._state = this.__adapter.createState({ $$state: state }, getters)
    this.__subscribers = []
    this.__watchStopHandle = null
  }

  public get state (): S {
    return this._state.$$state
  }

  public get getters (): { [K in keyof G]: ReturnType<G[K]> } {
    return this.__adapter.getters
  }

  public subscribe (fn: Subscriber<S>, options?: SubscribeOptions): () => void {
    const oldLength = this.__subscribers.length
    // eslint-disable-next-line @typescript-eslint/prefer-includes
    if (this.__subscribers.indexOf(fn) < 0) {
      if (options?.prepend) {
        this.__subscribers.unshift(fn)
      } else {
        this.__subscribers.push(fn)
      }
      if (oldLength === 0) {
        this.__watchStopHandle = this.__adapter.watch(() => this._state.$$state, (value) => {
          this.__subscribers.slice().forEach(sub => { sub(value as S) })
        }, {
          deep: true
        })
      }
    }
    return () => {
      unsubscribe(this, fn)
    }
  }
}

function unsubscribe (self: any, fn: Subscriber<any>): void {
  const i = self.__subscribers.indexOf(fn)
  if (i > -1) {
    self.__subscribers.splice(i, 1)
  }
  if (self.__subscribers.length === 0 && self.__watchStopHandle != null) {
    self.__watchStopHandle()
    self.__watchStopHandle = null
  }
}
