const fs = require('fs')
const path = require('path')
const resolve = file => path.resolve(__dirname, file)
const MFS = require('memory-fs')
const webpack = require('webpack')
const chokidar = require('chokidar')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

// レンダラーを作成
// クライアント及びサーバーのバンドルファイル、HTMLテンプレートの更新を発火地点として、レンダラーを更新する
module.exports = function setupDevServer (app, initRenderer) {
  let bundle
  let template
  let clientManifest
  const templatePath = resolve('../src/index.template.html')

  // レスポンスのHTMLを生成するためのレンダラーが準備済みであることを保証する
  let ready
  const readyRendererPromise = new Promise(r => { ready = r })

  // レスポンスのHTMLを生成するためのレンダラーを初期化、更新する
  const updateRenderer = () => {
    if (bundle && clientManifest) { // サーバー及びクライアントのバンドルが作成済みであれば
      ready() // thenの発火を許し、

      // createBundleRenderlerを実行し、server.js内のrenderer変数に対して新しいレンダラーを渡す
      initRenderer(bundle, //Vueをレンダリングするバンドル
        {
          basedir: resolve('../dist'),
          runInNewContext: false,
          template, // レンダリングしたVueを挿入するHTMLテンプレート
          clientManifest // HTMLテンプレートにバンドルを読む<script>タグを挿入する
        })
    }
  }

  // SSRに用いるHTMLファイルを更新した時に、レンダラーも更新する
  template = fs.readFileSync(templatePath, 'utf-8')
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8')
    console.log('index.html template updated.')
    updateRenderer()
  })

  // クライアント用にバンドルされるファイルの更新を監視
  const clientCompiler = webpack(clientConfig)
  const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
    noInfo: true
  })
  app.use(devMiddleware)

  // ファイルの更新をクライアントに通知
  app.use(require('webpack-hot-middleware')(clientCompiler, { heartbeat: 5000 }))

  // ファイルの更新時に、レンダラーも更新する
  clientCompiler.plugin('done', stats => {
    clientManifest = JSON.parse(readFile(
      devMiddleware.fileSystem,
      'vue-ssr-client-manifest.json'
    ))
    updateRenderer()
  })

  // SSR用のバンドル
  const serverCompiler = webpack(serverConfig)
  const mfs = new MFS()
  serverCompiler.outputFileSystem = mfs
  // SSR用にバンドルされるファイルの更新時に、レンダラーも更新する
  serverCompiler.watch({}, (err, stats) => {
    bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json')) // vue-ssr-webpack-pluginによって生成される
    updateRenderer()
  })

  return readyRendererPromise
}

// バンドル、マニフェストファイル取得のヘルパー
const readFile = (fs, file) => {
  try {
    return fs.readFileSync(path.join(clientConfig.output.path, file), 'utf-8') // serverConfig.output.pathでも同じパスが取得できる
  } catch (e) {}
}
