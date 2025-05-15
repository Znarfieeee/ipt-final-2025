const { Sequelize } = require("sequelize");
const config = require("../config.json");

const sequelize = new Sequelize({
  dialect: "mysql",
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  logging: false,
});

const db = {
  sequelize,
  Sequelize,
  User: require("../models/user.model")(sequelize),
  Department: require("../models/department.model")(sequelize),
  Employee: require("../models/employee.model")(sequelize),
  Request: require("../models/request.model")(sequelize),
  RequestItem: require("../models/requestItem.model")(sequelize),
  Workflow: require("../models/workflow.model")(sequelize),
};

// Define relationships
db.Department.hasMany(db.Employee);
db.Employee.belongsTo(db.Department);

// Fix User-Employee relationship
db.User.hasOne(db.Employee, { foreignKey: "userId" });
db.Employee.belongsTo(db.User, { foreignKey: "userId" });

db.Employee.hasMany(db.Request);
db.Request.belongsTo(db.Employee);

db.Request.hasMany(db.RequestItem);
db.RequestItem.belongsTo(db.Request);

db.Employee.hasMany(db.Workflow);
db.Workflow.belongsTo(db.Employee);

module.exports = db;
