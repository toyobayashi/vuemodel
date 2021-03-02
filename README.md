# vuemodel

Use this if you do not want Vuex!

Support Vue 2, Vue 3, even React!

[API Documentation](https://github.com/toyobayashi/vuemodel/blob/main/docs/api/index.md)

## Why use this

* You do not need Vuex but only want global state management

* You think Vuex is not friendly to TypeScript's type inference and IDE reference jumping

* You are tired of committing mutations and dispatching actions

* You are using React and [@tybys/reactivuety](https://github.com/toyobayashi/reactivuety/)

* ~~You want to create another Vuex~~

## Usage

### Basic

Use static method `VueModel.create(Vue, { state, getters? })` to create a model and use it in template / JSX.

The first argument is the implementation of Vue, or something like `IVueImpl` below:

``` ts
interface IVueImpl {
  reactive?: <T extends object> (target: T) => T
  computed?: (fn: () => void) => any
  watch?: WatchFunction
  extend?: (options: any) => new () => { $watch: WatchFunction; _data: any; [x: string]: any }
  [x: string]: any
}

type WatchFunction = <T>(source: T | (() => T), cb: (value: T, ...args: any[]) => any, options?: {
  immediate?: boolean
  deep?: boolean
  [x: string]: any
}) => () => void
```

Example:

```jsx
import * as Vue from 'vue' // Vue 3
// import Vue from 'vue' // Vue 2

// React with @tybys/reactivuety
// import { reactive } from '@vue/reactivity'
// import { computed, watch } from '@tybys/reactivuety'
// const Vue = { reactive, computed, watch }

import { VueModel } from '@tybys/vuemodel'

const model = VueModel.create(Vue, {
  state: {
    a: { count: 1 }
  },
  getters: {
    computedCount (state) {
      return state.a.count * 2
    }
  }
})
// or
// const model = new VueModel(Vue, { ... })

const Component = Vue.defineComponent({
  setup () {
    const onClick = () => { model.state.a.count++ }
    return () => (
      <>
        <p>{model.state.a.count} * 2 = {model.getters.computedCount}</p>
        <button onClick={onClick}>+</button>
      </>
    )
  }
})
```

### Bind Vue implementation

Use `VueModel.extend(Vue)` to create a new constructor bound a vue implementation

```js
import * as Vue from 'vue' // Vue 3
import { VueModel } from '@tybys/vuemodel'

const Model = VueModel.extend(Vue)
const model = Model.create({
  state: {
    a: { count: 1 }
  },
  getters: {
    computedCount (state) {
      return state.a.count * 2
    }
  }
})
// or
// const model = new Model({ ... })
```

### Implement interface

Better type inference support than Vuex!

```ts
import * as Vue from 'vue' // Vue 3

import { VueModel } from '@tybys/vuemodel'
import type { IVueModel, ISubscribeOptions, Subscriber } from '@tybys/vuemodel'

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
      computedCount (state) { // <- no return type
        return state.a.count * 2
      }
    }
  })

  public get count () {
    return this.state.a.count
  }

  public get computedCount () { 
    return this.getters.computedCount // infer => number
  }

  // like action
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

### Extended class

```ts
import * as Vue from 'vue' // Vue 3
import { VueModel } from '@tybys/vuemodel'

interface State {
  a: { count: number }
}

const getters = {
  computedCount (state: State) { // <- no return type
    return state.a.count * 2
  }
}

class Store extends VueModel<State, typeof getters> {
  public constructor () {
    super(Vue, {
      state: {
        a: { count: 1 }
      },
      getters: getters
    })
  }

  public get count () {
    return this.state.a.count
  }

  public get computedCount () {
    return this.getters.computedCount // infer => number
  }

  // like action
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
