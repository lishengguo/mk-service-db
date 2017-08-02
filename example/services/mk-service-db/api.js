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
        var transactionWrapper = (data, ctx) => {
            currentDB.transaction((t) => {
                try {
                    var promise = ctx._handler(data, ctx);
                    if (promise && promise.catch) {
                        promise.catch(ex => {
                            //捕获到数据库错误
                            console.log('捕获到数据库脚本错误')
                            ctx.error(ex)
                            throw (ex)
                        })
                        return promise;
                    } else {
                        promise !== undefined && ctx.return(promise);
                        console.warn('启用数据库事务，必须返回数据库查询的Promise对象才能自动回滚！')
                    }
                } catch (ex) {
                    //捕获到代码错误
                    console.log('捕获到api中的代码错误')
                    ctx.error(ex)
                    throw (ex)
                }
            }).catch(ex => {
                //console.log('捕获到数据库引擎错误')
                console.log(ex)
                //throw (ex)
            })
        }
        ctx._handler = ctx.handler
        ctx.handler = transactionWrapper
        Object.assign(transactionWrapper, ctx._handler)
    }

    return true
}

module.exports = api