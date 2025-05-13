const { Sequelize } = require("sequelize")

const sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST || "localhost",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ipt_final",
    logging: false,
})

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

// Define relationships
db.Department.hasMany(db.Employee)
db.Employee.belongsTo(db.Department)

db.Employee.hasMany(db.Request)
db.Request.belongsTo(db.Employee)

db.Request.hasMany(db.RequestItem)
db.RequestItem.belongsTo(db.Request)

db.Employee.hasMany(db.Workflow)
db.Workflow.belongsTo(db.Employee)

module.exports = db
