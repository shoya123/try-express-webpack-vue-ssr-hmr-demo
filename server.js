const express = require('express')
const setupDevServer = require('./build/setup-dev-server')
const { createBundleRenderer } = require('vue-server-renderer')

const app = express()

let renderer
let initRenderer = (bundle, options) => {
  renderer = createBundleRenderer(bundle, options)
}

// レスポンスを返すためのレンダラーができていることを保証するプロミスを取得
let readyRendererPromise = setupDevServer(app, initRenderer)

app.get('*', (req, res) => {
  // レンダラーが準備済みの時はHTMLを描画してレスポンスを返す
  readyRendererPromise.then(() => {
    renderer.renderToString({
      title: 'express + webpack + Vue + SSR + HMR',
      url: req.url
    },
    (err, html) => {
      res.send(html)
    })
  })
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
})
