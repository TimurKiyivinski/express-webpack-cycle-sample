'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const expressSanitizer = require('express-sanitizer')
const expressSession = require('express-session')
const cors = require('cors')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const UserAPI = require('./api/user')
const FruitAPI = require('./api/fruit')

function Server (connection, env) {
  return new Promise((resolve, reject) => {
    // Create express application
    const app = express()

    const User = connection.model('User', {
      username: {
        type: String,
        unique: true
      },
      password: String
    })

    // Configure passport
    passport.use(new LocalStrategy((username, password, done) => {
      console.log(`User ${username} is logging in with password ${password}`)
      User.findOne({ username: username, password: password }, (err, user) => {
        if (err) {
          done(err, false, { message: 'Error finding user' })
        } else if (user === null) {
          done(null, false, { message: 'Invalid user details' })
        } else {
          done(null, user)
        }
      })
    }))

    passport.serializeUser((user, done) => {
      done(null, user._id)
    })

    passport.deserializeUser((id, done) => {
      User.findOne({ _id: id }, (err, user) => {
        if (err) {
          done(err)
        } else {
          done(null, user)
        }
      })
    })

    // Load third party express middlewares
    app.use(bodyParser.json()) // Parse data sent to Express
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(expressSanitizer()) // Sanitizes input
    app.use(cors()) // Enable CORS

    // Passport requirements
    app.use(cookieParser())
    app.use(expressSession({ secret: 'everyone i disagree with is a nazi', resave: false, saveUninitialized: false }))
    app.use(passport.initialize())
    app.use(passport.session())

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

    // TODO: Refactor middlewares
    const requireLogin = (req, res, next) => {
      if (req.user) {
        next()
      } else {
        res.status(401).json({
          err: true,
          message: 'Access denied'
        })
      }
    }

    // Login API
    app.get('/v1/login', (req, res) => {
      res.json({
        err: true
      })
    })

    app.get('/v1/logout', (req, res) => {
      req.logout()
      res.clearCookie('userid')
      res.json({
        err: false
      })
    })

    app.post('/v1/login', passport.authenticate('local', { failureRedirect: '/v1/login' }), (req, res) => {
      res.cookie('userid', req.user._id, { maxAge: 2592000000 })
      res.json({
        err: false,
        message: `Logged in as user ${req.user.username}`
      })
    })

    const userAPI = new UserAPI(User)
    app.post('/v1/user', (req, res) => {
      userAPI.create(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.all('/v1/*', [requireLogin])

    app.get('/v1/user/:id', (req, res) => {
      userAPI.readOne(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.get('/v1/user', (req, res) => {
      userAPI.read(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.put('/v1/user/:id', (req, res) => {
      userAPI.update(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    app.delete('/v1/user/:id', (req, res) => {
      userAPI.delete(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
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

    app.get('/v1/fruit', requireLogin, (req, res) => {
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
