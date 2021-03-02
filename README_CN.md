# vuemodel

不想用 Vuex？试试这个！

支持 Vue 2，Vue 3，甚至 React！

[API 文档](https://github.com/toyobayashi/vuemodel/blob/main/docs/api/index.md)

## 为什么用

* 你不需要 Vuex 但你只需要全局状态管理

* 你认为 Vuex 对 TypeScript 的类型推导和 IDE 跳转支持不友好

* 你厌倦了提交 mutations 和分发 actions

* 你在使用 React 和 [@tybys/reactivuety](https://github.com/toyobayashi/reactivuety/)

* ~~你想另外造一个 Vuex~~

## 用法

### 基本

使用静态方法 `VueModel.create(Vue, { state, getters? })` 创建一个 model 然后直接用在模板或 JSX 里面。

第一个参数是 Vue 的实现，或者是类似下面 `IVueImpl` 的东西：

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

例子:

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

### 绑定 Vue 的实现

使用 `VueModel.extend(Vue)` 创建一个已经绑定 Vue 实现的 Model 构造函数。

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

### 实现接口

比 Vuex 更棒的类型推断！

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
      computedCount (state) { // <- 这里没有标注返回值类型
        return state.a.count * 2
      }
    }
  })

  public get count () {
    return this.state.a.count
  }

  public get computedCount () { 
    return this.getters.computedCount // 推导出 number
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

### 继承类

```ts
import * as Vue from 'vue' // Vue 3
import { VueModel } from '@tybys/vuemodel'

interface State {
  a: { count: number }
}

const getters = {
  computedCount (state: State) { // <- 这里没有标注返回值类型
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
    return this.getters.computedCount // 推导出 number
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
