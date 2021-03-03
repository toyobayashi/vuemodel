# vuemodel

Use this if you do not want Vuex!

Support Vue 2, Vue 3, even React!

[API Documentation](https://github.com/toyobayashi/vuemodel/blob/main/docs/api/index.md)

[中文](https://github.com/toyobayashi/vuemodel/blob/main/README_CN.md)

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
  reactive?: <T extends object> (target: T) => any
  computed?: (fn: () => void) => any
  extend?: (options: any) => new () => { _data: any; [x: string]: any }
  [x: string]: any
}
```

Example:

```jsx
import * as Vue from 'vue' // Vue 3
// import Vue from 'vue' // Vue 2

// React with @tybys/reactivuety
// import { reactive } from '@vue/reactivity'
// import { computed } from '@tybys/reactivuety'
// const Vue = { reactive, computed }

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

class MyStore implements IVueModel<State, any> {
  // @override
  public get state () {
    return this.__model.state
  }

  // @override
  public get getters () {
    return this.__model.getters
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

class MyStore extends VueModel<State, typeof getters> {
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
}
```

### Mutations and actions

If you prefer Vuex's pattern, you can call `Store.prototype.registerMutation` or `Store.prototype.registerAction` member method then pass the return value to `Store.prototype.commit` or `Store.prototype.dispatch`.

```ts
import * as Vue from 'vue' // Vue 3
import { Store } from '@tybys/vuemodel'
import type { IMutation, IAction } from '@tybys/vuemodel'

interface State {
  a: { count: number }
}

// class Store extends VueModel
class MyStore extends Store<State, {}> {
  private __addMutation: IMutation<number>
  private __addAction: IAction<number, void>
  public constructor () {
    super(Vue, {
      state: {
        a: { count: 1 }
      }
    })

    this.__addMutation = this.registerMutation<number>('m_add', (payload: number): void => {
      this.state.a.count += payload
    })

    this.__addAction = this.registerAction<number, void>('a_add', (payload: number): void | Promise<void> => {
      this.commit(this.__addMutation, payload)
      // return Promise.resolve()
    })
  }

  public add (): Promise<void> {
    return this.dispatch(this.__addAction, 1)
  }
}
```
