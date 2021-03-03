import type { IAction, IGettersTree, IMutation, ISubscribeOptions, IVueImpl, Subscriber } from './types'
import { ActionEvent, MutationEvent, oid } from './util'
import type { IVueModel, IVueModelExtended, IVueModelOptions } from './VueModel'
import { VueModel } from './VueModel'

/** @public */
export interface IStore<S extends object, G extends IGettersTree<S>> extends IVueModel<S, G> {
  subscribe (fn: Subscriber<S>, options?: ISubscribeOptions): () => void

  commit (mutation: IMutation<void> | Array<IMutation<void>>): void
  commit<P> (mutation: IMutation<P> | Array<IMutation<P>>, payload: P): void

  dispatch<R> (action: IAction<void, R>): Promise<R>
  dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  dispatch<P, R> (action: Array<IAction<P, R>>, payload: P): Promise<R[]>

  registerMutation (name: string, handler: () => void): IMutation<void>
  registerMutation<P> (name: string, handler: (payload: P) => void): IMutation<P>

  registerAction<R> (name: string, handler: () => R | Promise<R>): IAction<void, R>
  registerAction<P, R> (name: string, handler: (payload: P) => R | Promise<R>): IAction<P, R>
}

/** @public */
export interface IStoreExtended extends IVueModelExtended {
  new <S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IStore<S, G>
  create<S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IStore<S, G>
  extend (Vue: IVueImpl): IStoreExtended

  commit (mutation: IMutation<void> | Array<IMutation<void>>): void
  commit<P> (mutation: IMutation<P> | Array<IMutation<P>>, payload: P): void

  dispatch<R> (action: IAction<void, R>): Promise<R>
  dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  dispatch<P, R> (action: Array<IAction<P, R>>, payload: P): Promise<R[]>

  registerMutation (name: string, handler: () => void): IMutation<void>
  registerMutation<P> (name: string, handler: (payload: P) => void): IMutation<P>

  registerAction<R> (name: string, handler: () => R | Promise<R>): IAction<void, R>
  registerAction<P, R> (name: string, handler: (payload: P) => R | Promise<R>): IAction<P, R>
}

/** @public */
export class Store<S extends object, G extends IGettersTree<S>> extends VueModel<S, G> implements IStore<S, G> {
  public static extend (Vue: IVueImpl): IStoreExtended {
    return class StoreExtended<S extends object, G extends IGettersTree<S>> extends Store<S, G> {
      public static create<S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): StoreExtended<S, G> {
        return new StoreExtended(options)
      }

      public constructor (options: IVueModelOptions<S, G>) {
        super(Vue, options)
      }
    }
  }

  public static create<S extends object, G extends IGettersTree<S>> (Vue: IVueImpl, options: IVueModelOptions<S, G>): Store<S, G> {
    return new Store(Vue, options)
  }

  public static commit (mutation: IMutation<void> | Array<IMutation<void>>): void
  public static commit<P> (mutation: IMutation<P> | Array<IMutation<P>>, payload: P): void
  public static commit (mutation: IMutation<any> | Array<IMutation<any>>, payload?: any): void {
    if (Array.isArray(mutation)) {
      mutation.forEach(m => { m.onCommit(payload) })
    } else {
      mutation.onCommit(payload)
    }
  }

  public static dispatch<R> (action: IAction<void, R>): Promise<R>
  public static dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  public static dispatch<P, R> (action: Array<IAction<P, R>>, payload: P): Promise<R[]>
  public static dispatch<R> (action: IAction<any, R> | Array<IAction<any, R>>, payload?: any): Promise<R | R[]> {
    if (Array.isArray(action)) {
      return Promise.all(action.map(a => Promise.resolve(a.onDispatch(payload))))
    }
    return Promise.resolve(action.onDispatch(payload))
  }

  private static readonly __mutations: Array<IMutation<any>> = []
  private static readonly __actions: Array<IAction<any, any>> = []

  public static registerMutation (name: string, handler: (this: void) => void): IMutation<void>
  public static registerMutation<P> (name: string, handler: (this: void, payload: P) => void): IMutation<P>
  public static registerMutation (name: string, handler: (this: void, payload?: any) => void): IMutation<any> {
    if (Store.__mutations.filter(m => m.name === name).length !== 0) {
      throw new Error(`Global mutation "${name}" has been registered`)
    }
    const mutation: IMutation<any> = { name, onCommit: (payload) => handler(payload) }
    Store.__mutations.push(mutation)
    return mutation
  }

  public static registerAction<R> (name: string, handler: (this: void) => R | Promise<R>): IAction<void, R>
  public static registerAction<P, R> (name: string, handler: (this: void, payload: P) => R | Promise<R>): IAction<P, R>
  public static registerAction<R> (name: string, handler: (this: void, payload?: any) => R | Promise<R>): IAction<any, R> {
    if (Store.__actions.filter(a => a.name === name).length !== 0) {
      throw new Error(`Global action "${name}" has been registered`)
    }
    const action: IAction<any, R> = { name, onDispatch: (payload) => handler(payload) }
    Store.__actions.push(action)
    return action
  }

  private readonly __subscribers: Array<Subscriber<S>>

  private readonly __mutations: Array<IMutation<any>>
  private readonly __actions: Array<IAction<any, any>>

  public constructor (Vue: IVueImpl, options: IVueModelOptions<S, G>) {
    super(Vue, options)
    this.__subscribers = []
    this.__mutations = []
    this.__actions = []
  }

  public registerMutation (name: string, handler: (this: this) => void): IMutation<void>
  public registerMutation<P> (name: string, handler: (this: this, payload: P) => void): IMutation<P>
  public registerMutation (name: string, handler: (this: this, payload?: any) => void): IMutation<any> {
    if (this.__mutations.filter(m => m.name === name).length !== 0) {
      throw new Error(`Mutation "${name}" has been registered`)
    }
    const mutation: IMutation<any> = { name, onCommit: (payload) => handler.call(this, payload) }
    this.__mutations.push(mutation)
    return mutation
  }

  public registerAction<R> (name: string, handler: (this: this) => R | Promise<R>): IAction<void, R>
  public registerAction<P, R> (name: string, handler: (this: this, payload: P) => R | Promise<R>): IAction<P, R>
  public registerAction<R> (name: string, handler: (this: this, payload?: any) => R | Promise<R>): IAction<any, R> {
    if (this.__actions.filter(a => a.name === name).length !== 0) {
      throw new Error(`Action "${name}" has been registered`)
    }
    const action: IAction<any, R> = { name, onDispatch: (payload) => handler.call(this, payload) }
    this.__actions.push(action)
    return action
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

  public commit (mutation: IMutation<void> | Array<IMutation<void>>): void
  public commit<P> (mutation: IMutation<P> | Array<IMutation<P>>, payload: P): void
  public commit (mutation: IMutation<any> | Array<IMutation<any>>, payload?: any): void {
    if (Array.isArray(mutation)) {
      mutation.forEach(m => {
        if (this.__mutations.indexOf(m) === -1) {
          throw new Error(`Unknown mutation "${m.name}"`)
        }
      })
    } else {
      if (this.__mutations.indexOf(mutation) === -1) {
        throw new Error(`Unknown mutation "${mutation.name}"`)
      }
    }

    const id = oid()
    if (Array.isArray(mutation)) {
      mutation.forEach(m => { m.onCommit(payload) })
    } else {
      mutation.onCommit(payload)
    }

    this.__subscribers.slice().forEach(sub => {
      sub(new MutationEvent(id, mutation, payload), this.state, null)
    })
  }

  public dispatch<R> (action: IAction<void, R>): Promise<R>
  public dispatch<P, R> (action: IAction<P, R>, payload: P): Promise<R>
  public dispatch<P, R> (action: Array<IAction<P, R>>, payload: P): Promise<R[]>
  public dispatch<R> (action: IAction<any, R> | Array<IAction<any, R>>, payload?: any): Promise<R | R[]> {
    if (Array.isArray(action)) {
      action.forEach(a => {
        if (this.__actions.indexOf(a) === -1) {
          throw new Error(`Unknown action "${a.name}"`)
        }
      })
    } else {
      if (this.__actions.indexOf(action) === -1) {
        throw new Error(`Unknown action "${action.name}"`)
      }
    }

    const id = oid()

    this.__subscribers.slice().forEach(sub => {
      sub(new ActionEvent(id, 'before', action, payload), this.state, null)
    })

    let promise: Promise<R | R[]>
    if (Array.isArray(action)) {
      promise = Promise.all(action.map(a => Promise.resolve(a.onDispatch(payload))))
    } else {
      promise = Promise.resolve(action.onDispatch(payload))
    }

    return new Promise<R | R[]>((resolve, reject) => {
      promise.then((r) => {
        try {
          this.__subscribers.slice().forEach(sub => {
            sub(new ActionEvent(id, 'after', action, payload), this.state, null)
          })
        } catch (_) {}
        resolve(r)
      }).catch(error => {
        try {
          this.__subscribers.slice().forEach(sub => {
            sub(new ActionEvent(id, 'error', action, payload), this.state, error)
          })
        } catch (_) {}
        reject(error)
      })
    })
  }
}

function unsubscribe (self: any, fn: Subscriber<any>): void {
  const i = self.__subscribers.indexOf(fn)
  if (i > -1) {
    self.__subscribers.splice(i, 1)
  }
}
