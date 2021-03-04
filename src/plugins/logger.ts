// Credits: borrowed code from fcomb/redux-logger

import { deepCopy } from '../util'

import type { StorePlugin } from '../Store'
import type { ISubscriberEvent } from '../types'

/** @public */
export interface ILogger extends Partial<Pick<Console, 'groupCollapsed' | 'group' | 'groupEnd'>> {
  log(message: string, color: string, payload: any): void
  log(message: string): void
}

/** @public */
export interface ILoggerOption<S> {
  collapsed?: boolean
  filter?: <P extends ISubscriberEvent<any>>(mutation: P, stateBefore: S, stateAfter: S) => boolean
  transformer?: (state: S) => any
  mutationTransformer?: <P extends ISubscriberEvent<any>>(mutation: P) => any
  actionFilter?: <P extends ISubscriberEvent<any>>(action: P, state: S) => boolean
  actionTransformer?: <P extends ISubscriberEvent<any>>(action: P) => any
  logMutations?: boolean
  logActions?: boolean
  logger?: ILogger
}

/** @public */
export function createLogger<S extends object> ({
  collapsed = true,
  filter = (_mutation, _stateBefore, _stateAfter) => true,
  transformer = state => state,
  mutationTransformer = mut => mut,
  actionFilter = (_action, _state) => true,
  actionTransformer = act => act,
  logMutations = true,
  logActions = true,
  logger = console
}: ILoggerOption<S> = {}): StorePlugin<S, any> {
  return store => {
    let prevState = deepCopy(store.state)

    if (typeof logger === 'undefined') {
      return
    }

    if (!logMutations && !logActions) {
      return
    }

    store.subscribe((event, state) => {
      if (!('status' in event)) {
        if (!logMutations) return
        const mutation = event
        const nextState = deepCopy(state)

        if (filter(mutation, prevState, nextState)) {
          const formattedTime = getFormattedTime()
          const formattedMutation = mutationTransformer(mutation)
          const message = `mutation ${mutation.type}${formattedTime}`

          startMessage(logger, message, collapsed)
          logger.log('%cprev state', 'color: #9E9E9E; font-weight: bold', transformer(prevState))
          logger.log('%cmutation', 'color: #03A9F4; font-weight: bold', formattedMutation)
          logger.log('%cnext state', 'color: #4CAF50; font-weight: bold', transformer(nextState))
          endMessage(logger)
        }

        prevState = nextState
      } else if (event.status === 'before') {
        if (!logActions) return
        const action = event
        if (actionFilter(action, state)) {
          const formattedTime = getFormattedTime()
          const formattedAction = actionTransformer(action)
          const message = `action ${action.type}${formattedTime}`

          startMessage(logger, message, collapsed)
          logger.log('%caction', 'color: #03A9F4; font-weight: bold', formattedAction)
          endMessage(logger)
        }
      }
    })
  }
}

function startMessage (logger: ILogger, message: string, collapsed: boolean): void {
  const startMessage = collapsed
    ? logger.groupCollapsed
    : logger.group

  // render
  try {
    startMessage!.call(logger, message)
  } catch (e) {
    logger.log(message)
  }
}

function endMessage (logger: ILogger): void {
  try {
    logger.groupEnd!()
  } catch (e) {
    logger.log('—— log end ——')
  }
}

function getFormattedTime (): string {
  const time = new Date()
  return ` @ ${pad(time.getHours(), 2)}:${pad(time.getMinutes(), 2)}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`
}

function repeat (str: string, times: number): string {
  return (new Array(times + 1)).join(str)
}

function pad (num: number, maxLength: number): string {
  return `${repeat('0', maxLength - num.toString().length)}${num}`
}
