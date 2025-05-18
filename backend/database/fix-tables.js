/**
 * Utility script to manually sync/fix database tables
 * Use only when needed for maintenance
 */
const db = require("../_helpers/db")

async function syncTables() {
    try {
        console.log("Starting database table repair...")

        // First drop problematic tables if they exist
        try {
            await db.sequelize.query("DROP TABLE IF EXISTS `refreshTokens`;")
            console.log("Dropped refreshTokens table")
        } catch (err) {
            console.error("Error dropping refreshTokens:", err.message)
        }

        // Create all tables safely
        console.log("Creating/updating tables...")

        // Create individual tables in order of dependencies
        await db.User.sync({ alter: true })
        console.log("- Users table synced")

        await db.Department.sync({ alter: true })
        console.log("- Departments table synced")

        await db.Employee.sync({ alter: true })
        console.log("- Employees table synced")

        await db.Request.sync({ alter: true })
        console.log("- Requests table synced")

        await db.RequestItem.sync({ alter: true })
        console.log("- RequestItems table synced")

        await db.Workflow.sync({ alter: true })
        console.log("- Workflows table synced")

        // Try to recreate refreshToken table without constraints
        try {
            await db.RefreshToken.sync({ alter: true })
            console.log("- RefreshTokens table synced")
        } catch (err) {
            console.error("Error syncing refreshTokens:", err.message)
            console.log("The application can still run without this table.")
        }

        console.log("Database repair completed!")
    } catch (err) {
        console.error("Error repairing database:", err)
    } finally {
        // Close the connection
        await db.sequelize.close()
    }
}

// Run the sync function if executed directly
if (require.main === module) {
    syncTables().catch(err => {
        console.error("Failed to sync tables:", err)
        process.exit(1)
    })
}
