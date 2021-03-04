/// <reference path="../dist/vuemodel.d.ts" />
class Store {
  get state () {
    return this.__model.state
  }

  get getters () {
    return this.__model.getters
  }

  constructor () {
    this.__model = vuemodel.Store.create(Vue, {
      state: {
        a: { count: 1 }
      },
      getters: {
        computedCount (state) {
          return state.a.count * 2
        }
      },
      plugins: [
        vuemodel.createLogger()
      ]
    })

    this.addMutation = this.__model.registerMutation('m_add', function (n) {
      this.state.a.count += n
    })

    this.addAction = this.__model.registerAction('a_add', (n) => {
      this.__model.commit(this.addMutation, n)
      return Promise.resolve(this.state.a.count)
    })

    // this.__model.subscribe((event, state) => {
    //   console.log(this.__model)
    //   console.log(Object.keys(this.__model))
    //   console.log(JSON.stringify(this.__model))
    //   console.log('toString: ' + this.__model)
    // })
  }

  get count () {
    return this.state.a.count
  }

  get computedCount () {
    return this.getters.computedCount
  }

  add (n = 1) {
    return this.__model.dispatch(this.addAction, n).then(r => {
      console.log(r)
    })
  }

  install (app, ...options) {
    return this.__model.install.call(this, app, ...options)
  }
}

const store = new Store()
