
const config = (options) => {
    Object.assign(current, options)
    if (!options.host && options.dbs) {
        Object.assign(current, current.dbs[0])
    }
    current.init();
    return current;
}


const current = {
    init: () => { },
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

module.exports = Object.assign(config, {
    current,
})
