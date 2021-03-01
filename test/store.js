class Store {
  get state () {
    return this.__model.state
  }

  get getters () {
    return this.__model.getters
  }

  subscribe(fn, options) {
    return this.__model.subscribe(fn, options)
  }

  constructor () {
    this.__model = vuemodel.VueModel.create(Vue, {
      state: {
        a: { count: 1 }
      },
      getters: {
        computedCount (state) {
          return state.a.count * 2
        }
      }
    })
  }

  get count () {
    return this.state.a.count
  }

  get computedCount () {
    return this.getters.computedCount
  }

  add () {
    return Promise.resolve().then(() => {
      this.state.a.count++
    })
  }
}

const store = new Store()
store.subscribe((state) => {
  console.log(state)
})
