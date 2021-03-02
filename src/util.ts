// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export function forEach<T> (arr: T[], fn: (value: T, index: number, self: T[]) => void | 'break'): void {
  for (let i = 0; i < arr.length; i++) {
    const shouldBreak = fn(arr[i], i, arr)
    if (shouldBreak === 'break') {
      break
    }
  }
}
