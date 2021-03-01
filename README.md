# vuemodel

Use this if you do not want Vuex!

```ts
import * as Vue from 'vue' // Vue 3

// import Vue from 'vue' // Vue 2

// React with @tybys/reactivuety
// import { reactive } from '@vue/reactivity'
// import { computed, watch } from '@tybys/reactivuety'
// const Vue = { reactive, computed, watch }

import { VueModel, IVueModel, SubscribeOptions, Subscriber } from '@tybys/vuemodel'

interface State {
  a: { count: number }
}

class Store implements IVueModel<State, any> {
  // @override
  public get state () {
    return this.__model.state
  }

  // @override
  public get getters () {
    return this.__model.getters
  }

  // @override
  public subscribe(fn: Subscriber<State>, options?: SubscribeOptions): () => void {
    return this.__model.subscribe(fn, options)
  }

  private __model = VueModel.create(Vue, {
    state: {
      a: { count: 1 }
    },
    getters: {
      computedCount (state): number {
        return state.a.count * 2
      }
    }
  })

  public get count (): number {
    return this.state.a.count
  }

  public get computedCount (): number {
    return this.getters.computedCount
  }

  public add (): Promise<void> {
    return Promise.resolve().then(() => {
      this.state.a.count++
    })
  }

  // public install (appOrVue) {
  //   vue plugin
  // }
}
```
