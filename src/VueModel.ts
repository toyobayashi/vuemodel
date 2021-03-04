import type { IGettersTree, IVueImpl } from './types'
import { def } from './util'

import { VueModelImpl } from './VueModelImpl'

/** @public */
export interface IVueModelBase<S extends object, G extends IGettersTree<S>> {
  state: S
  getters: { [K in keyof G]: ReturnType<G[K]> }
}

/** @public */
export interface IVueModel<S extends object, G extends IGettersTree<S>> extends Readonly<IVueModelBase<S, G>> {
  replaceState (state: S): void
  hotUpdate (options?: { getters?: G }): void
  toJSON (): IVueModelBase<S, G>
  toString (): string
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

  private readonly __impl!: VueModelImpl<S, G>

  public constructor (Vue: IVueImpl, options: IVueModelOptions<S, G>) {
    def(this, '__impl', new VueModelImpl(Vue, options.state, options.getters))
  }

  public get state (): S {
    return this.__impl.data.$$state
  }

  public get getters (): { [K in keyof G]: ReturnType<G[K]> } {
    return this.__impl.getters
  }

  public replaceState (state: S): void {
    this.__impl.data.$$state = state
  }

  public hotUpdate (options?: { getters?: G }): void {
    if (options?.getters) {
      this.__impl.resetState(this.state, options.getters, true)
    }
  }

  public toJSON (): IVueModelBase<S, G> {
    return { state: this.state, getters: this.getters }
  }

  // @override
  public toString (): string {
    return JSON.stringify(this.toJSON())
  }
}
