module.exports = {
  // output: {
  //   doc: false
  // },
  rollupGlobals: {
  },
  bundleOnly: ['umd', 'cjs', 'esm-browser', { type: 'esm-bundler', minify: false }],
  bundleDefine: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}
