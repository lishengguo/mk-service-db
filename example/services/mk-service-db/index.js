/*
 *  index.js        //属性说明，导出的config方法在服务器启动时调用，api对象的下级方法绑定到对应的url，如: api.create 方法绑定的url是 "/company/create"
*/
const api = require("./api")

const index = {
    apiRootUrl: false,
    name: "db",
    version: "",
    description: "",
    author: "lsg",
    config,
    api,
}
module.exports = index



/*
 *  config.js        //初始化参数设置
*/

function config(options) {
    var current = config.current
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
