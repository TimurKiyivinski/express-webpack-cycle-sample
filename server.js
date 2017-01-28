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
      name: {
        type: String,
        unique: true
      },
      password: String
    })

    // Configure passport
    passport.use(new LocalStrategy((username, password, done) => {
      User.findOne({ username: username, password: password }, (err, user) => {
        if (err) {
          done(err)
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

    app.post('/v1/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
      res.redirect('/')
    })

    const userAPI = new UserAPI(User)
    app.post('/v1/user', (req, res) => {
      userAPI.create(req)
        .then(data => res.status(data.status).json(data))
        .catch(data => res.status(data.status).json(data))
    })

    const requireLogin = (req, res, next) => {
      if (req.user) {
        console.dir(req.user)
        return next()
      } else {
        res.redirect('/login')
      }
    }

    app.all('/v1/', [requireLogin])

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

    app.get('/v1/fruit', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
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
