/**
 * Run all database fixes
 */
const { fixDatabaseTables } = require("./fix-tables")

async function runAllFixes() {
    try {
        console.log("Starting database fixes...")

        // Fix database tables
        await fixDatabaseTables()

        console.log("All database fixes completed successfully!")
        process.exit(0)
    } catch (error) {
        console.error("Failed to run database fixes:", error)
        process.exit(1)
    }
}

runAllFixes()
