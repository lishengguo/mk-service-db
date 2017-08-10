const { config, start } = require("mk-server")
const serverConfig = require("./config")

const db = require("./services/db/index.js")
const user = require("./services/user/index.js")

const services = {
    db,
    user, 
}

config(serverConfig({ services }))

start()