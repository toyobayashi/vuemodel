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
export type WatchFunction = <T>(source: T | (() => T), cb: (value: T, ...args: any[]) => any, options?: {
  immediate?: boolean
  deep?: boolean
  [x: string]: any
}) => () => void

/** @public */
export interface IVueImpl {
  reactive?: <T extends object> (target: T) => any
  computed?: (fn: () => void) => any
  watch?: WatchFunction
  extend?: (options: any) => new () => { $watch: WatchFunction; _data: any; [x: string]: any }
  [x: string]: any
}
