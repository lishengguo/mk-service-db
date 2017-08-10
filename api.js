const Sequelize = require("sequelize")
const cls = require('continuation-local-storage')
Sequelize.useCLS(cls.createNamespace('my-own-namespace'))

var config
const dbs = {}

const api = {

    currentDB: null,

    getDB: (name) => dbs[name || 'currentDB'],

    _init: (current) => {
        config = current
        dbs.currentDB = dbs[config.name] = newDB(config)
        dbs.currentDB.config.transactionType = config.transactionType
        if (Array.isArray(config.dbs)) {
            config.dbs.filter(d => !dbs[d.name]).forEach(d => {
                dbs[d.name] = newDB(d);
                dbs[d.name].config.transactionType = d.transactionType
            })
        }
        if (config.server) { //注册数据库事务拦截器
            var array = config.server.interceptors || [];
            if (array.filter(a => a == interceptor) == 0) {
                array.push(interceptor)
            }
            config.server.interceptors = array
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
    transactionType = transactionType || config.transactionType
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

module.exports = api