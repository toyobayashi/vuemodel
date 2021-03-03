import type { IAction, IMutation, ISubscriberEvent } from './types'

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export function forEach<T> (arr: T[], fn: (value: T, index: number, self: T[]) => void | 'break'): void {
  for (let i = 0; i < arr.length; i++) {
    const shouldBreak = fn(arr[i], i, arr)
    if (shouldBreak === 'break') {
      break
    }
  }
}

export const oid = (function () {
  let index = 0
  const PROCESS_UNIQUE: [number, number, number, number, number] = [0, 0, 0, 0, 0]

  function reset (): void {
    index = ~~(Math.random() * 0xffffff)
    for (let i = 0; i < 5; i++) PROCESS_UNIQUE[i] = Math.floor(Math.random() * 256)
  }

  function generate (time?: number): string {
    if (typeof time !== 'number') {
      time = ~~(Date.now() / 1000)
    }

    index = (index + 1) % 0xffffff
    const inc = index
    const buffer = []

    buffer[3] = time & 0xff
    buffer[2] = (time >> 8) & 0xff
    buffer[1] = (time >> 16) & 0xff
    buffer[0] = (time >> 24) & 0xff

    buffer[4] = PROCESS_UNIQUE[0]
    buffer[5] = PROCESS_UNIQUE[1]
    buffer[6] = PROCESS_UNIQUE[2]
    buffer[7] = PROCESS_UNIQUE[3]
    buffer[8] = PROCESS_UNIQUE[4]

    buffer[11] = inc & 0xff
    buffer[10] = (inc >> 8) & 0xff
    buffer[9] = (inc >> 16) & 0xff

    let res = ''
    for (let i = 0; i < buffer.length; i++) {
      const hex = buffer[i].toString(16)
      res += (hex.length === 1 ? ('0' + hex) : hex)
    }
    return res
  }

  reset()

  return generate
})()

export class MutationEvent<P> implements ISubscriberEvent<IMutation<P>> {
  public id: string
  public status: 'after'
  public target: ISubscriberEvent<IMutation<P>>['target']
  public payload: P

  public constructor (
    id: string,
    target: ISubscriberEvent<IMutation<P>>['target'],
    payload: P
  ) {
    this.id = id
    this.status = 'after'
    this.target = target
    this.payload = payload
  }

  public get type (): 'mutation' {
    return 'mutation'
  }
}

export class ActionEvent<P> implements ISubscriberEvent<IAction<P, any>> {
  public constructor (
    public id: string,
    public status: ISubscriberEvent<IAction<P, any>>['status'],
    public target: ISubscriberEvent<IAction<P, any>>['target'],
    public payload: P
  ) {}

  public get type (): 'action' {
    return 'action'
  }
}
