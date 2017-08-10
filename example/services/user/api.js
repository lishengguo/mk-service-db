const config = (options) => {
    Object.assign(current, options)
    current.db = current.services.db.api.getDB()
    return current
}
const current = config.current = {}

//返回值类型
const ping = (dto) => true

//返回Promise对象
const version = (data, ctx) => {
    var db = current.db;
    return db.query("SELECT version() version", { type: db.QueryTypes.SELECT })
}

//代码错误
const errcode = (dto) => ctx.token

//数据库sql错误
const errdb = (data, ctx) => {
    var db = current.db;
    return db.query("SELECT version1() version", { type: db.QueryTypes.SELECT })
}

//手动事件，数据库sql错误
const errdbmanul = (data, ctx) => {
    var db = config.db;
    return db.query("SELECT version1() version", { type: db.QueryTypes.SELECT })
}
errdbmanul.transactionType = "manul"

//手动事件，代码错误
const errcodemanul = (dto) => ctx.token
errcodemanul.transactionType = "manul"


module.exports = {
    config,
    api: {
        errcode,
        errdb,
        errdbmanul,
        errcodemanul,
        ping,
        version,
    },
}

