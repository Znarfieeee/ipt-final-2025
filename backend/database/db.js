const mysql = require("mysql2/promise")
const fs = require("fs").promises
const path = require("path")
const config = require("../config.js")

// Database configuration for direct MySQL connection
const dbConfig = {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    multipleStatements: true,
}

async function initializeDatabase() {
    try {
        // Create connection
        const connection = await mysql.createConnection(dbConfig)

        // Create database if it doesn't exist
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${config.database.database}`
        )

        // Close the connection
        await connection.end()

        return true
    } catch (error) {
        throw error
    }
}

// Create a pool for raw MySQL operations if needed
async function createPool() {
    try {
        // This function is kept for compatibility with the server.js changes
        // The actual connection will be handled by Sequelize in _helpers/db.js
        return {} // Return empty object as Sequelize handles the real connection
    } catch (error) {
        throw error
    }
}

module.exports = {
    initializeDatabase,
    createPool,
}
