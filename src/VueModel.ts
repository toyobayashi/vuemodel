import type { IGettersTree, IVueImpl } from './types'
import type { IVueAdapter } from './VueAdapter'

import { VueAdapter } from './VueAdapter'

/** @public */
export interface IVueModel<S extends object, G extends IGettersTree<S>> {
  readonly state: S
  readonly getters: { [K in keyof G]: ReturnType<G[K]> }
}

/** @public */
export interface IVueModelOptions<S extends object, G extends IGettersTree<S>> {
  state: S
  getters?: G
}

/** @public */
export interface IVueModelExtended {
  new <S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IVueModel<S, G>
  create<S extends object, G extends IGettersTree<S>> (options: IVueModelOptions<S, G>): IVueModel<S, G>
  extend (Vue: IVueImpl): IVueModelExtended
}

/** @public */
export class VueModel<S extends object, G extends IGettersTree<S>> implements IVueModel<S, G> {
  public static extend (Vue: IVueImpl): IVueModelExtended {
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

  private readonly __adapter: IVueAdapter

  public constructor (Vue: IVueImpl, options: IVueModelOptions<S, G>) {
    const { state, getters } = options
    this.__adapter = new VueAdapter(Vue)
    this.__data = this.__adapter.createState({ $$state: state }, getters)
  }

  public get state (): S {
    return this.__data.$$state
  }

  public get getters (): { [K in keyof G]: ReturnType<G[K]> } {
    return this.__adapter.getters
  }
}
