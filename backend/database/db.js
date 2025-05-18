const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");
const config = require("../config.js");

// Database configuration for direct MySQL connection
const dbConfig = {
  host: config.database.host || "localhost",
  user: config.database.user || "root",
  password: config.database.password || "",
  multipleStatements: true,
};

async function initializeDatabase() {
  try {
    console.log("Attempting to connect to MySQL with:", {
      host: dbConfig.host,
      user: dbConfig.user,
      // Not logging password for security
      database: config.database.database || "fullstack_db",
    });

    // Create connection
    const connection = await mysql.createConnection(dbConfig);

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${
        config.database.database || "fullstack_db"
      }`
    );

    // Close the connection
    await connection.end();

    console.log("Database initialization successful");
    return true;
  } catch (error) {
    console.error("Database initialization error:", error.message);

    // For development purposes only, allow proceeding without database
    if (process.env.NODE_ENV !== "production") {
      console.log("Continuing without database connection in development mode");
      return true;
    }

    throw error;
  }
}

// Create a pool for raw MySQL operations if needed
async function createPool() {
  try {
    // This function is kept for compatibility with the server.js changes
    // The actual connection will be handled by Sequelize in _helpers/db.js
    return {}; // Return empty object as Sequelize handles the real connection
  } catch (error) {
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  createPool,
};
