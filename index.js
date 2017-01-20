const fs = require('fs')

const mockgoose = require('mockgoose')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const Server = require('./server')

;(function () {
  const env = JSON.parse(fs.readFileSync('env.json', 'utf8'))
  // Run server
  if (env.database === 'mock') {
    // Use a mock database
    mockgoose(mongoose).then(() => {
      const connection = mongoose.createConnection('mongodb://ava/Test')
      Server(connection, env)
        .then(server => {
          console.log(`[MERMAID] Application debugging with ${env.database} debugging`)
        })
        .catch(err => {
          console.error(`Application failed with error ${err}`)
        })
    })
  } else {
    // Create an actual database instance
    const connection = mongoose.createConnection(env.mongodb)
    Server(connection, env)
      .then(server => {
        console.log('[MERMAID] Application started')
      })
      .catch(err => {
        console.error(`Application failed with error ${err}`)
      })
  }
})()
