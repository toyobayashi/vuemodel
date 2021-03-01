'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/vuemodel.cjs.min.js')
} else {
  module.exports = require('./dist/vuemodel.cjs.js')
}
