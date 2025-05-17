const { Sequelize } = require("sequelize")
const config = require("../config")

// Database configuration - no logging
const sequelize = new Sequelize({
    dialect: "mysql",
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.password,
    database: config.database.database,
    logging: false, // Disable logging
    pool: {
        max: 5, // Maximum number of connections in pool
        min: 0, // Minimum number of connections in pool
        acquire: 30000, // Maximum time, in milliseconds, to acquire a connection
        idle: 10000, // Maximum time, in milliseconds, that a connection can be idle
    },
})

// Test database connection on startup
sequelize.authenticate().catch(() => {
    // Silent failure - error handled by application
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
    RefreshToken: require("../models/refreshToken.model")(sequelize),
}

// Define relationships
db.Department.hasMany(db.Employee)
db.Employee.belongsTo(db.Department)

// Update User-Employee relationship to allow multiple employees per user
db.User.hasMany(db.Employee, { foreignKey: "userId" })
db.Employee.belongsTo(db.User, { foreignKey: "userId" })

// Setup refresh token relationship with user
db.User.hasMany(db.RefreshToken, { foreignKey: "accountId" })
db.RefreshToken.belongsTo(db.User, { foreignKey: "accountId" })

db.Employee.hasMany(db.Request)
db.Request.belongsTo(db.Employee)

// Enhance relationship for Request and RequestItem with explicit onDelete and constraints
db.Request.hasMany(db.RequestItem, {
    foreignKey: {
        name: "requestId",
        allowNull: false,
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
})
db.RequestItem.belongsTo(db.Request, {
    foreignKey: {
        name: "requestId",
        allowNull: false,
    },
})

db.Employee.hasMany(db.Workflow)
db.Workflow.belongsTo(db.Employee)

// Initialize models silently
async function logModels() {
    try {
        // No need to log model information

        // Remove duplicate requests
        await cleanupDuplicateRequests()
    } catch {
        // Silent failure
    }
}

// Add a function to clean up duplicate requests in the database
async function cleanupDuplicateRequests() {
    try {
        // Get all requests
        const requests = await db.Request.findAll({
            attributes: ["id", "type", "status", "employeeId", "createdAt"],
            raw: true,
        })

        // Group by type+employeeId+status (likely duplicates)
        const grouped = {}
        requests.forEach(req => {
            const key = `${req.type}_${req.employeeId}_${req.status}`
            if (!grouped[key]) {
                grouped[key] = []
            }
            grouped[key].push(req)
        })

        // Find groups with more than one request (duplicates)
        for (const [key, group] of Object.entries(grouped)) {
            if (group.length > 1) {
                // Sort by creation date, keep the newest one
                group.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )

                // Keep the first one (newest), delete the rest
                for (let i = 1; i < group.length; i++) {
                    await db.Request.destroy({ where: { id: group[i].id } })
                }
            }
        }
    } catch {
        // Silent failure
    }
}

// Run the model logging after initialization
setTimeout(logModels, 1000)

module.exports = db
