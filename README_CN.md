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
  reactive?: <T extends object> (target: T) => any
  computed?: (fn: () => void) => any
  extend?: (options: any) => new () => { _data: any; [x: string]: any }
  [x: string]: any
}
```

例子:

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

  // 类似 action
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
    return this.getters.computedCount // 推导出 number
  }

  // 类似 action
  public add (): Promise<void> {
    return Promise.resolve().then(() => {
      this.state.a.count++
    })
  }
}
```

### Mutations and actions

如果你更喜欢 Vuex 的模式，你可以调用 `Store.prototype.registerMutation` 或 `Store.prototype.registerAction` 成员方法然后把返回值传入 `Store.prototype.commit` 或 `Store.prototype.dispatch`。

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
