/*
 *  index.js        //属性说明，导出的config方法在服务器启动时调用，api对象的下级方法绑定到对应的url，如: api.create 方法绑定的url是 "/company/create"
*/
const { api, config } = require("./api")

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


