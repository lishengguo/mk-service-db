const Sequelize = require("sequelize")
const cls = require('continuation-local-storage')
Sequelize.useCLS(cls.createNamespace('my-own-namespace'))
 
let current = null

const dbs = {}

const api = {

    currentDB: null,

    getDB: (name) => dbs[name || 'currentDB'],

    _init: (options) => { 
        current = options
        dbs.currentDB = dbs[current.name] = newDB(current)
        dbs.currentDB.config.transactionType = current.transactionType
        if (Array.isArray(current.dbs)) {
            current.dbs.filter(d => !dbs[d.name]).forEach(d => {
                dbs[d.name] = newDB(d);
                dbs[d.name].config.transactionType = d.transactionType
            })
        }
        if (current.server) { //注册数据库事务拦截器
            var array = current.server.interceptors || [];
            if (array.filter(a => a == interceptor) == 0) {
                array.push(interceptor)
            }
            current.server.interceptors = array
        }
    }
}

function newDB(cfg) {
    return new Sequelize(cfg.database, cfg.user, cfg.pwd, {
        host: cfg.host,
        port: cfg.port,
        dialect: cfg.type,
    })
}

function interceptor(ctx) {
    var currentDB = null;
    var serviceConfig = ctx.service.config && ctx.service.config.current;
    var transactionType = ctx.handler.transactionType
        || serviceConfig && serviceConfig.transactionType
        || serviceConfig && serviceConfig.db && serviceConfig.db.config.transactionType;
    if (serviceConfig && serviceConfig.db) {
        currentDB = serviceConfig.db
    } 
    transactionType = transactionType || current.transactionType
    currentDB = currentDB || dbs.currentDB

    if (currentDB && transactionType == 'auto' && !ctx._handler) {
        var transactionWrapper = function () {
            return currentDB.transaction((t) =>
                ctx._handler(...arguments)
            )
        }
        ctx._handler = ctx.handler
        ctx.handler = transactionWrapper
        Object.assign(transactionWrapper, ctx._handler)
    }

    return true
}



/*
 *  config.js        //初始化参数设置
*/

function config(options) { 
    let current = config.current
    Object.assign(current, options)
    if (!options.host && options.dbs) {
        Object.assign(current, current.dbs[0])
    }
    api._init(current)
}
config.current = {
    name: "bizdata",
    type: "mysql",
    user: "root",
    pwd: "mydbpassword",
    host: "localhost",
    port: 3306,
    database: "bizdata_dev",
    transactionType: "auto",
    dbs: [],
}

module.exports = { api, config }