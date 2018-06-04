const http = require('http')
const co = require('co')
const express = require('express')
const MongoClient = require('mongodb').MongoClient

const { configure } = require('./config/express')
const { mongodb } = require('./config')

const consumer = require('./consumer')

let app
let server
let dbClient

/**
 * Start the web app.
 *
 * @returns {Promise} when app end to start
 */
async function start() {
  if (app) {
    return app
  }
  app = configure(express())

  dbClient = await MongoClient.connect(mongodb.url).catch(err =>
    console.warn('Db connection failed: ', err),
  )

  const db = dbClient.db(mongodb.name)

  // Todo: connection close
  await consumer(db)

  const port = app.get('port')
  server = http.createServer(app)
  await server.listen(port)
  // eslint-disable-next-line no-console
  console.log(`✔ Server running on port ${port}`)
  return app
}

/**
 * Stop the web app.
 *
 * @returns {Promise} when app end to start
 */
async function stop() {
  if (server) {
    await server.close()
    dbClient.close()
    server = null
    app = null
    dbClient = null
  }
  return Promise.resolve()
}

if (!module.parent) {
  co(start)
}

module.exports = {
  start,
  stop,
  get server() {
    return server
  },
  get app() {
    return app
  },
}
