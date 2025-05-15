// const { Sequelize } = require("sequelize")

// const sequelize = new Sequelize({
//     dialect: "mysql",
//     host: process.env.DB_HOST || "localhost",
//     username: process.env.DB_USER || "root",
//     password: process.env.DB_PASSWORD || "",
//     database: process.env.DB_NAME || "fullstack_db",
//     logging: false,
// })

// const db = {
//     sequelize,
//     Sequelize,
//     User: require("../models/user.model")(sequelize),
//     Department: require("../models/department.model")(sequelize),
//     Employee: require("../models/employee.model")(sequelize),
//     Request: require("../models/request.model")(sequelize),
//     RequestItem: require("../models/requestItem.model")(sequelize),
//     Workflow: require("../models/workflow.model")(sequelize),
// }

// // Define relationships
// db.Department.hasMany(db.Employee)
// db.Employee.belongsTo(db.Department)

// db.Employee.hasMany(db.Request)
// db.Request.belongsTo(db.Employee)

// db.Request.hasMany(db.RequestItem)
// db.RequestItem.belongsTo(db.Request)

// db.Employee.hasMany(db.Workflow)
// db.Workflow.belongsTo(db.Employee)

// module.exports = db

// ------------------------------------------------------

const config = require("../config.json")
const mysql = require("mysql2/promise")
const { Sequelize } = require("sequelize")

module.exports = db = {}

initialize()

async function initialize() {
    // Create database if it does not exist
    const { host, port, user, password, database } = config.database
    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
    })
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`)

    const db = {
        sequelize,
        Sequelize,
        User: require("../models/user.model")(sequelize),
        Department: require("../models/department.model")(sequelize),
        Employee: require("../models/employee.model")(sequelize),
        Request: require("../models/request.model")(sequelize),
        RequestItem: require("../models/requestItem.model")(sequelize),
        Workflow: require("../models/workflow.model")(sequelize),
    }

    // connect to db
    const sequelize = new Sequelize(database, user, password, {
        dialect: "mysql",
    })

    // Init models and add them to exported db object
    db.Account = require("../accounts/account.model")(sequelize)
    db.RefreshToken = require("../accounts/refresh-token.model")(sequelize)

    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: "CASCADE" })
    db.RefreshToken.belongsTo(db.Account)
    // Define relationships
    db.Department.hasMany(db.Employee)
    db.Employee.belongsTo(db.Department)

    db.Employee.hasMany(db.Request)
    db.Request.belongsTo(db.Employee)

    db.Request.hasMany(db.RequestItem)
    db.RequestItem.belongsTo(db.Request)

    db.Employee.hasMany(db.Workflow)
    db.Workflow.belongsTo(db.Employee)

    // sync all models into the database
    await sequelize.sync({ alter: true })
}
