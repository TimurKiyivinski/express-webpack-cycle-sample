'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const expressSanitizer = require('express-sanitizer')
const cors = require('cors')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const FruitAPI = require('./api/fruit')

function Server (connection, env) {
  return new Promise((resolve, reject) => {
    // Create express application
    const app = express()
    // Load third party express middlewares
    app.use(bodyParser.json()) // Parse data sent to Express
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(expressSanitizer()) // Sanitizes input
    app.use(cors()) // Enable CORS

    // Enable webpack in development environment
    if (env.environment === 'development') {
      const webConfig = require('./webpack.config')
      const middlewareConfig = {
        publicPath: '/assets/',
        stats: {
          colors: true
        }
      }
      const webpackCompiler = webpack(webConfig)

      // Webpack middlewares
      app.use(webpackDevMiddleware(webpackCompiler, middlewareConfig))
      app.use(webpackHotMiddleware(webpackCompiler))
    }

    // Put your Express code here
    app.use((req, res, next) => {
      // This is an example middleware
      next()
    })

    const fruitAPI = new FruitAPI(connection)
    app.post('/v1/fruit', (req, res) => {
      fruitAPI.create(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.get('/v1/fruit/:id', (req, res) => {
      fruitAPI.readOne(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.get('/v1/fruit', (req, res) => {
      fruitAPI.read(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.put('/v1/fruit/:id', (req, res) => {
      fruitAPI.update(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.delete('/v1/fruit/:id', (req, res) => {
      fruitAPI.delete(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    // Frontend files such as index.html and webpack's bundle.js
    app.use(express.static('public'))

    // Route everything except /assets to index.html to be parsed by frontend router
    app.get(/^((?!\/assets\/).)*$/, (req, res) => {
      res.sendFile('/index.html', {
        root: 'public'
      })
    })

    // Start Express
    const server = app.listen(process.env.PORT || env.port, () => {
      resolve(server)
    })
  })
}

module.exports = Server
