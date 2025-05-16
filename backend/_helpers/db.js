const { Sequelize } = require("sequelize");
const config = require("../config.json");

// Add more verbose logging for debugging
console.log("Database configuration:", {
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  database: config.database.database,
  // Not logging password for security
});

const sequelize = new Sequelize({
  dialect: "mysql",
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  logging: console.log, // Enable logging for debugging
  pool: {
    max: 5, // Maximum number of connections in pool
    min: 0, // Minimum number of connections in pool
    acquire: 30000, // Maximum time, in milliseconds, to acquire a connection
    idle: 10000, // Maximum time, in milliseconds, that a connection can be idle
  },
});

// Test database connection on startup
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
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
  RefreshToken: require("../models/refreshToken.model")(sequelize),
};

// Define relationships
db.Department.hasMany(db.Employee);
db.Employee.belongsTo(db.Department);

// Update User-Employee relationship to allow multiple employees per user
db.User.hasMany(db.Employee, { foreignKey: "userId" });
db.Employee.belongsTo(db.User, { foreignKey: "userId" });

// Setup refresh token relationship with user
db.User.hasMany(db.RefreshToken, { foreignKey: "accountId" });
db.RefreshToken.belongsTo(db.User, { foreignKey: "accountId" });

db.Employee.hasMany(db.Request);
db.Request.belongsTo(db.Employee);

db.Request.hasMany(db.RequestItem);
db.RequestItem.belongsTo(db.Request);

db.Employee.hasMany(db.Workflow);
db.Workflow.belongsTo(db.Employee);

// Add a debug loggin function
async function logModels() {
  try {
    console.log("Database models initialized:");
    // Log all models
    for (const [name, model] of Object.entries(db)) {
      if (model.tableName) {
        const count = await model.count();
        console.log(`- ${name}: ${count} records`);
      }
    }

    // Remove duplicate requests
    await cleanupDuplicateRequests();
  } catch (err) {
    console.error("Error in database logging:", err);
  }
}

// Add a function to clean up duplicate requests in the database
async function cleanupDuplicateRequests() {
  try {
    console.log("Checking for duplicate requests...");

    // Get all requests
    const requests = await db.Request.findAll({
      attributes: ["id", "type", "status", "employeeId", "createdAt"],
      raw: true,
    });

    console.log(`Total requests before cleanup: ${requests.length}`);

    // Group by type+employeeId+status (likely duplicates)
    const grouped = {};
    requests.forEach((req) => {
      const key = `${req.type}_${req.employeeId}_${req.status}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(req);
    });

    // Find groups with more than one request (duplicates)
    let removedCount = 0;
    for (const [key, group] of Object.entries(grouped)) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicate requests for key: ${key}`);

        // Sort by creation date, keep the newest one
        group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Keep the first one (newest), delete the rest
        for (let i = 1; i < group.length; i++) {
          console.log(`Removing duplicate request ID: ${group[i].id}`);
          await db.Request.destroy({ where: { id: group[i].id } });
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(
        `Removed ${removedCount} duplicate requests from the database`
      );
    } else {
      console.log("No duplicate requests found");
    }

    // Count again to verify
    const afterCount = await db.Request.count();
    console.log(`Total requests after cleanup: ${afterCount}`);
  } catch (err) {
    console.error("Error cleaning up duplicate requests:", err);
  }
}

// Run the model logging after initialization
setTimeout(logModels, 1000);

module.exports = db;
