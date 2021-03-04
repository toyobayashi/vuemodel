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

export function def (obj: any, name: string, value: any): void {
  try {
    Object.defineProperty(obj, name, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: value
    })
  } catch (_) {
    obj[name] = value
  }
}

export class MutationEvent<P> implements ISubscriberEvent<IMutation<P>> {
  public constructor (
    public id: string,
    public payload: P,
    public type: string
  ) {}
}

export class ActionEvent<P> implements ISubscriberEvent<IAction<P, any>> {
  public constructor (
    public id: string,
    public payload: P,
    public status: 'before' | 'after' | 'error',
    public type: string
  ) {}
}

export function deepCopy<T> (obj: T, cache: Array<{ original: T; copy: any }> = []): T {
  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  const hit = cache.filter(c => c.original === obj)[0]
  if (hit) {
    return hit.copy
  }

  const copy: any = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy((obj as any)[key], cache)
  })

  return copy
}
