/** @public */
export interface IAction<P, R> {
  name: string
  onDispatch (payload: P): R | Promise<R>
}

/** @public */
export interface IMutation<P> {
  name: string
  onCommit (payload: P): void
}

/** @public */
export type PayloadType<T> = T extends IAction<infer AP, any> ? AP : (T extends IMutation<infer MP> ? MP : any)

/** @public */
export interface ISubscriberEvent<T extends IAction<any, any> | IMutation<any>> {
  id: string
  type: 'mutation' | 'action'
  status: 'before' | 'after' | 'error'
  target: T | T[]
  payload: PayloadType<T>
}

/** @public */
export type Subscriber<S extends object> = (event: ISubscriberEvent<IAction<any, any> | IMutation<any>>, state: S, error: Error | null) => void

/** @public */
export interface ISubscribeOptions {
  prepend?: boolean
}

/** @public */
export interface IGettersTree<S extends object> {
  [x: string]: (state: S) => any
}

/** @public */
export interface IVueImpl {
  reactive?: <T extends object> (target: T) => any
  computed?: (fn: () => void) => any
  extend?: (options: any) => new () => { _data: any; [x: string]: any }
  [x: string]: any
}
