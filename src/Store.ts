import devtoolPlugin from './plugins/devtool'
import type { IAction, IGettersTree, IMutation, ISubscribeOptions, IVueImpl, Subscriber } from './types'
import { ActionEvent, addAction, addMutation, def, MutationEvent, oid } from './util'
import type { IVueModel, IVueModelExtended, IVueModelOptions } from './VueModel'
import { VueModel } from './VueModel'

/** @public */
export interface IStore<S extends object, G extends IGettersTree<S>> extends IVueModel<S, G> {
  subscribe (fn: Subscriber<S>, options?: ISubscribeOptions): () => void

  commit (mutation: IMutation<void>): void
  commit (mutation: string, payload?: any): void
  commit<P> (mutation: IMutation<P>, payload: P): void

  dispatch<R> (action: IAction<void, R>): Promise<R>
  dispatch (action: string, payload?: any): Promise<any[]>
  dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>

  registerMutation (name: string, handler: () => void): IMutation<void>
  registerMutation<P> (name: string, handler: (payload: P) => void): IMutation<P>
  clearMutations (name?: string): void

  registerAction<R> (name: string, handler: () => R | Promise<R>): IAction<void, R>
  registerAction<P, R> (name: string, handler: (payload: P) => R | Promise<R>): IAction<P, R>
  clearActions (name?: string): void

  install (appOrVue: any): any
}

/** @public */
export type StorePlugin<S extends object, G extends IGettersTree<S>> = (store: IStore<S, G>) => any

/** @public */
export interface IStoreOptions<S extends object, G extends IGettersTree<S>> extends IVueModelOptions<S, G> {
  devtools?: boolean
  plugins?: Array<StorePlugin<S, G>>
}

/** @public */
export interface IStoreExtended extends IVueModelExtended {
  new <S extends object, G extends IGettersTree<S>> (options: IStoreOptions<S, G>): IStore<S, G>
  create<S extends object, G extends IGettersTree<S>> (options: IStoreOptions<S, G>): IStore<S, G>
  extend (Vue: IVueImpl): IStoreExtended

  commit (mutation: IMutation<void>): void
  commit (mutation: string, payload?: any): void
  commit<P> (mutation: IMutation<P>, payload: P): void

  dispatch<R> (action: IAction<void, R>): Promise<R>
  dispatch (action: string, payload?: any): Promise<any[]>
  dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>

  registerMutation (name: string, handler: () => void): IMutation<void>
  registerMutation<P> (name: string, handler: (payload: P) => void): IMutation<P>
  clearMutations (name?: string): void

  registerAction<R> (name: string, handler: () => R | Promise<R>): IAction<void, R>
  registerAction<P, R> (name: string, handler: (payload: P) => R | Promise<R>): IAction<P, R>
  clearActions (name?: string): void
}

/** @public */
export class Store<S extends object, G extends IGettersTree<S>> extends VueModel<S, G> implements IStore<S, G> {
  public static extend (Vue: IVueImpl): IStoreExtended {
    return class StoreExtended<S extends object, G extends IGettersTree<S>> extends Store<S, G> {
      public static create<S extends object, G extends IGettersTree<S>> (options: IStoreOptions<S, G>): StoreExtended<S, G> {
        return new StoreExtended(options)
      }

      public constructor (options: IStoreOptions<S, G>) {
        super(Vue, options)
      }
    }
  }

  public static create<S extends object, G extends IGettersTree<S>> (Vue: IVueImpl, options: IStoreOptions<S, G>): Store<S, G> {
    return new Store(Vue, options)
  }

  public static commit (mutation: IMutation<void>): void
  public static commit (mutation: string, payload?: any): void
  public static commit<P> (mutation: IMutation<P>, payload: P): void
  public static commit (mutation: string | IMutation<any>, payload?: any): void {
    if (typeof mutation === 'string') {
      if (Object.prototype.hasOwnProperty.call(Store.__mutations, mutation)) {
        Store.__mutations[mutation].slice().forEach(m => { m(payload) })
      } else {
        throw new Error(`Unknown mutation "${mutation}"`)
      }
    } else {
      if (mutation.isDisposed()) throw new Error(`Disposed mutation "${mutation.type}"`)
      if (Object.prototype.hasOwnProperty.call(Store.__mutations, mutation.type) && Store.__mutations[mutation.type].indexOf(mutation) !== -1) {
        mutation(payload)
      } else {
        throw new Error(`Unknown mutation "${mutation.type}"`)
      }
    }
  }

  public static dispatch<R> (action: IAction<void, R>): Promise<R>
  public static dispatch (action: string, payload?: any): Promise<any[]>
  public static dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  public static dispatch (action: string | IAction<any, any>, payload?: any): Promise<any> {
    if (typeof action === 'string') {
      if (Object.prototype.hasOwnProperty.call(Store.__actions, action)) {
        return Promise.all(Store.__actions[action].slice().map(a => Promise.resolve(a(payload))))
      } else {
        throw new Error(`Unknown action "${action}"`)
      }
    } else {
      if (action.isDisposed()) throw new Error(`Disposed action "${action.type}"`)
      if (Object.prototype.hasOwnProperty.call(Store.__actions, action.type) && Store.__actions[action.type].indexOf(action) !== -1) {
        return Promise.resolve(action(payload))
      } else {
        throw new Error(`Unknown action "${action.type}"`)
      }
    }
  }

  private static readonly __mutations: Record<string, Array<IMutation<any>>> = Object.create(null)
  private static readonly __actions: Record<string, Array<IAction<any, any>>> = Object.create(null)

  public static registerMutation (name: string, handler: (this: void) => void): IMutation<void>
  public static registerMutation<P> (name: string, handler: (this: void, payload: P) => void): IMutation<P>
  public static registerMutation (name: string, handler: (this: void, payload?: any) => void): IMutation<any> {
    return addMutation(Store.__mutations, name, handler)
  }

  public static clearMutations (name?: string): void {
    if (name) {
      if (Store.__mutations[name]) {
        Store.__mutations[name].slice().forEach(m => { m.dispose() })
      }
    } else {
      Object.keys(Store.__mutations).forEach(n => { Store.clearMutations(n) })
    }
  }

  public static registerAction<R> (name: string, handler: (this: void) => R | Promise<R>): IAction<void, R>
  public static registerAction<P, R> (name: string, handler: (this: void, payload: P) => R | Promise<R>): IAction<P, R>
  public static registerAction<R> (name: string, handler: (this: void, payload?: any) => R | Promise<R>): IAction<any, R> {
    return addAction(Store.__actions, name, handler)
  }

  public static clearActions (name?: string): void {
    if (name) {
      if (Store.__actions[name]) {
        Store.__actions[name].slice().forEach(a => { a.dispose() })
      }
    } else {
      Object.keys(Store.__actions).forEach(n => { Store.clearActions(n) })
    }
  }

  private readonly __subscribers!: Array<Subscriber<S>>

  private readonly __mutations!: Record<string, Array<IMutation<any>>>
  private readonly __actions!: Record<string, Array<IAction<any, any>>>

  public constructor (Vue: IVueImpl, options: IStoreOptions<S, G>) {
    super(Vue, options)
    def(this, '__subscribers', [])
    def(this, '__mutations', Object.create(null))
    def(this, '__actions', Object.create(null))

    if (options.plugins && options.plugins.length > 0) {
      options.plugins.forEach(plugin => { plugin(this) })
    }

    const useDevtools = options.devtools !== undefined ? (!!options.devtools) : false
    if (useDevtools) {
      devtoolPlugin(this)
    }
  }

  public registerMutation (name: string, handler: (this: this) => void): IMutation<void>
  public registerMutation<P> (name: string, handler: (this: this, payload: P) => void): IMutation<P>
  public registerMutation (name: string, handler: (this: this, payload?: any) => void): IMutation<any> {
    return addMutation(this.__mutations, name, handler, this)
  }

  public clearMutations (name?: string): void {
    if (name) {
      if (this.__mutations[name]) {
        this.__mutations[name].slice().forEach(m => { m.dispose() })
      }
    } else {
      Object.keys(this.__mutations).forEach(n => { this.clearMutations(n) })
    }
  }

  public registerAction<R> (name: string, handler: (this: this) => R | Promise<R>): IAction<void, R>
  public registerAction<P, R> (name: string, handler: (this: this, payload: P) => R | Promise<R>): IAction<P, R>
  public registerAction<R> (name: string, handler: (this: this, payload?: any) => R | Promise<R>): IAction<any, R> {
    return addAction(this.__actions, name, handler, this)
  }

  public clearActions (name?: string): void {
    if (name) {
      if (this.__actions[name]) {
        this.__actions[name].slice().forEach(m => { m.dispose() })
      }
    } else {
      Object.keys(this.__actions).forEach(n => { this.clearActions(n) })
    }
  }

  public subscribe (fn: Subscriber<S>, options?: ISubscribeOptions): () => void {
    if (this.__subscribers.indexOf(fn) < 0) {
      if (options?.prepend) {
        this.__subscribers.unshift(fn)
      } else {
        this.__subscribers.push(fn)
      }
    }
    return () => {
      unsubscribe(this, fn)
    }
  }

  public commit (mutation: IMutation<void>): void
  public commit (mutation: string, payload?: any): void
  public commit<P> (mutation: IMutation<P>, payload: P): void
  public commit (mutation: string | IMutation<any>, payload?: any): void {
    const type = typeof mutation === 'string' ? mutation : mutation.type
    if (typeof mutation === 'string') {
      if (Object.prototype.hasOwnProperty.call(this.__mutations, mutation)) {
        this.__mutations[mutation].slice().forEach(m => { m(payload) })
      } else {
        Store.commit(mutation, payload)
      }
    } else {
      if (mutation.isDisposed()) throw new Error(`Disposed mutation "${mutation.type}"`)
      if (Object.prototype.hasOwnProperty.call(this.__mutations, mutation.type) && this.__mutations[mutation.type].indexOf(mutation) !== -1) {
        mutation(payload)
      } else {
        Store.commit(mutation, payload)
      }
    }

    const id = oid()

    this.__subscribers.slice().forEach(sub => {
      sub(new MutationEvent(id, payload, type), this.state, null)
    })
  }

  public dispatch<R> (action: IAction<void, R>): Promise<R>
  public dispatch (action: string, payload?: any): Promise<any[]>
  public dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  public dispatch (action: string | IAction<any, any>, payload?: any): Promise<any> {
    const type: string = typeof action === 'string' ? action : action.type

    const id = oid()

    this.__subscribers.slice().forEach(sub => {
      sub(new ActionEvent(id, payload, 'before', type), this.state, null)
    })

    let promise: Promise<any>

    if (typeof action === 'string') {
      if (Object.prototype.hasOwnProperty.call(this.__actions, action)) {
        promise = Promise.all(this.__actions[action].slice().map(a => Promise.resolve(a(payload))))
      } else {
        promise = Store.dispatch(action, payload)
      }
    } else {
      if (action.isDisposed()) throw new Error(`Disposed action "${action.type}"`)
      if (Object.prototype.hasOwnProperty.call(this.__actions, action.type) && this.__actions[action.type].indexOf(action) !== -1) {
        promise = Promise.resolve(action(payload))
      } else {
        promise = Store.dispatch(action, payload)
      }
    }

    return new Promise<any>((resolve, reject) => {
      promise.then((r) => {
        try {
          this.__subscribers.slice().forEach(sub => {
            sub(new ActionEvent(id, payload, 'after', type), this.state, null)
          })
        } catch (_) {}
        resolve(r)
      }).catch(error => {
        try {
          this.__subscribers.slice().forEach(sub => {
            sub(new ActionEvent(id, payload, 'error', type), this.state, error)
          })
        } catch (_) {}
        reject(error)
      })
    })
  }

  public install (appOrVue: any): any {
    if (appOrVue?.version) {
      if (Number(appOrVue.version.split('.')[0]) > 2) {
        appOrVue.config.globalProperties.$store = this
      } else {
        appOrVue.prototype.$store = this
      }
    }
  }
}

function unsubscribe (self: any, fn: Subscriber<any>): void {
  const i = self.__subscribers.indexOf(fn)
  if (i > -1) {
    self.__subscribers.splice(i, 1)
  }
}
