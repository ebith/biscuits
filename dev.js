const Bundler = require('parcel-bundler');
const express = require('express');
const proxy = require('http-proxy-middleware');

const bundler = new Bundler('./src/index.html', {cache: false});
const app = express();

app.use(
  '/pocket',
  proxy({
    target: 'https://getpocket.com/v3/',
    changeOrigin: true,
    pathRewrite: {'^/pocket': ''}
  })
);

app.use(bundler.middleware());
app.listen(1234);
