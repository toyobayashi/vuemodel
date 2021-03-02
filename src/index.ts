/** @public */
export type Subscriber<S extends object> = (state: S) => void

/** @public */
export interface ISubscribeOptions {
  prepend?: boolean
}

/** @public */
export interface IGettersTree<S extends object> {
  [x: string]: (state: S) => any
}

/** @public */
export interface IVueModel<S extends object, G extends IGettersTree<S>> {
  readonly state: S
  readonly getters: { [K in keyof G]: ReturnType<G[K]> }
  subscribe (fn: Subscriber<S>, options?: ISubscribeOptions): () => void
}

interface IObservedData<T> {
  $$state: T
}

/** @public */
export type WatchFunction = <T>(source: T | (() => T), cb: (value: T, ...args: any[]) => any, options?: {
  immediate?: boolean
  deep?: boolean
  [x: string]: any
}) => () => void

interface IVueAdapter {
  getters: any
  createState<T extends object> (target: IObservedData<T>, getters?: IGettersTree<T>): IObservedData<T>
  watch: WatchFunction
}

/** @public */
export interface IVueImpl {
  reactive?: <T extends object> (target: T) => T
  computed?: (fn: () => void) => any
  watch?: WatchFunction
  extend?: (options: any) => new () => { $watch: WatchFunction; _data: any; [x: string]: any }
  [x: string]: any
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
function forEach<T> (arr: T[], fn: (value: T, index: number, self: T[]) => void | 'break'): void {
  for (let i = 0; i < arr.length; i++) {
    const shouldBreak = fn(arr[i], i, arr)
    if (shouldBreak === 'break') {
      break
    }
  }
}

class VueAdapter implements IVueAdapter {
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

/** @public */
export interface IVueModelOptions<S extends object, G extends IGettersTree<S>> {
  state: S
  getters?: G
}

/** @public */
export class VueModel<S extends object, G extends IGettersTree<S>> implements IVueModel<S, G> {
  public static extend (Vue: IVueImpl): {
    new <S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IVueModel<S, G>
    create<S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IVueModel<S, G>
  } {
    return class VueModelExtended<S extends object, G extends IGettersTree<S>> extends VueModel<S, G> {
      public static create<S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): VueModelExtended<S, G> {
        return new VueModelExtended(options)
      }

      public constructor (options: IVueModelOptions<S, G>) {
        super(Vue, options)
      }
    }
  }

  public static create<S extends object, G extends IGettersTree<S>> (Vue: IVueImpl, options: IVueModelOptions<S, G>): VueModel<S, G> {
    return new VueModel(Vue, options)
  }

  private readonly __data: { $$state: S }

  private readonly __subscribers: Array<Subscriber<S>>

  // @ts-expect-error
  private __watchStopHandle: null | (() => void)

  private readonly __adapter: IVueAdapter

  public constructor (Vue: IVueImpl, options: IVueModelOptions<S, G>) {
    const { state, getters } = options
    this.__adapter = new VueAdapter(Vue)
    this.__data = this.__adapter.createState({ $$state: state }, getters)
    this.__subscribers = []
    this.__watchStopHandle = null
  }

  public get state (): S {
    return this.__data.$$state
  }

  public get getters (): { [K in keyof G]: ReturnType<G[K]> } {
    return this.__adapter.getters
  }

  public subscribe (fn: Subscriber<S>, options?: ISubscribeOptions): () => void {
    const oldLength = this.__subscribers.length
    // eslint-disable-next-line @typescript-eslint/prefer-includes
    if (this.__subscribers.indexOf(fn) < 0) {
      if (options?.prepend) {
        this.__subscribers.unshift(fn)
      } else {
        this.__subscribers.push(fn)
      }
      if (oldLength === 0) {
        this.__watchStopHandle = this.__adapter.watch(() => this.__data.$$state, (value) => {
          this.__subscribers.slice().forEach(sub => { sub(value) })
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
