const webpack = require('webpack')
const merge = require('webpack-merge')
const base = require('./webpack.base.config')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

const config = merge(base, {
  entry: {
    app: ['webpack-hot-middleware/client', './src/entry-client.js']
  },
  output: {
    filename: '[name].js'
  },
  plugins: [
    new VueSSRClientPlugin(), // こいつが、clientmanifestを出力してくれるんやと思われる
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
})

module.exports = config
