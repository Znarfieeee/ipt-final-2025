require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const db = require("./_helpers/db")
const { initializeDatabase, createPool } = require("./database/db")

// Create Express app
const app = express()

// Middleware
app.use(
    helmet({
        // Disable contentSecurityPolicy for development
        contentSecurityPolicy: false,
    })
)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

// Allow multiple origins for CORS
const allowedOrigins = [
    "https://ipt-final-2025-espelita.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

// CORS middleware
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true)

            // Check if origin is allowed
            if (allowedOrigins.indexOf(origin) === -1) {
                return callback(null, true) // Just allow all origins for now
            }
            return callback(null, true)
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Origin",
            "Accept",
        ],
        exposedHeaders: ["Content-Length", "Content-Type"],
    })
)

// Custom middleware to handle preflight requests
app.options(
    "*",
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Origin",
            "Accept",
        ],
    })
)

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({ message: "Authentication required" })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "sample-key"
        )
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" })
    }
}

// Basic routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" })
})

// Add a test endpoint with no authentication
app.get("/api/test", async (req, res) => {
    try {
        // Test database connection
        await db.sequelize.authenticate()

        // Try to get a count of users
        const userCount = await db.User.count()

        return res.json({
            message: "Database connection successful",
            userCount: userCount,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error connecting to database",
            error: error.message || "Unknown error",
        })
    }
})

// Add a public users API for quick testing
app.get("/api/public/users", async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: [
                "id",
                "title",
                "firstName",
                "lastName",
                "email",
                "role",
                "status",
            ], // Include title
        })

        return res.json({
            message: "Users retrieved successfully",
            users: users,
            count: users.length,
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching users",
            error: error.message,
        })
    }
})

// Auth routes
app.post(
    "/api/auth/login",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const { email, password } = req.body
            const user = await db.User.findOne({
                where: { email },
                include: [
                    {
                        model: db.Employee,
                        attributes: ["id", "employeeId", "position"],
                    },
                ],
            })

            if (!user) {
                return res
                    .status(401)
                    .json({ message: "Invalid email or password" })
            }

            // For development, accept any password for the demo
            // In production, use proper password comparison
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    employeeId: user.Employee?.id,
                },
                process.env.JWT_SECRET || "sample-key",
                { expiresIn: "24h" }
            )

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            })

            res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    title: user.title,
                    employeeId: user.Employee?.id,
                    position: user.Employee?.position,
                },
                token,
            })
        } catch (error) {
            res.status(500).json({ message: "Error during login process" })
        }
    }
)

// Token validation endpoint - keep for backward compatibility
app.get("/api/accounts/validate-token", async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            valid: false,
            message: "No token provided",
        })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "sample-key"
        )

        // Check if token is about to expire (less than 1 hour left)
        const currentTime = Math.floor(Date.now() / 1000)
        const timeRemaining = decoded.exp - currentTime

        let refreshedToken = null

        // If token is close to expiration (less than 1 hour), refresh it
        if (timeRemaining < 3600) {
            refreshedToken = jwt.sign(
                {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    employeeId: decoded.employeeId,
                },
                process.env.JWT_SECRET || "sample-key",
                { expiresIn: "24h" }
            )

            // Set the new token in cookies
            res.cookie("token", refreshedToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            })
        }

        return res.json({
            valid: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                employeeId: decoded.employeeId,
            },
            refreshed: !!refreshedToken,
            exp: decoded.exp,
            token: refreshedToken || token,
        })
    } catch (error) {
        return res.status(401).json({
            valid: false,
            message: "Invalid or expired token",
            error: error.message,
        })
    }
})

// Additional version without /api prefix
app.get("/accounts/validate-token", async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            valid: false,
            message: "No token provided",
        })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "sample-key"
        )

        // Check if token is about to expire (less than 1 hour left)
        const currentTime = Math.floor(Date.now() / 1000)
        const timeRemaining = decoded.exp - currentTime

        let refreshedToken = null

        // If token is close to expiration (less than 1 hour), refresh it
        if (timeRemaining < 3600) {
            refreshedToken = jwt.sign(
                {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    employeeId: decoded.employeeId,
                },
                process.env.JWT_SECRET || "sample-key",
                { expiresIn: "24h" }
            )

            // Set the new token in cookies
            res.cookie("token", refreshedToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            })
        }

        return res.json({
            valid: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                employeeId: decoded.employeeId,
            },
            refreshed: !!refreshedToken,
            exp: decoded.exp,
            token: refreshedToken || token,
        })
    } catch (error) {
        return res.status(401).json({
            valid: false,
            message: "Invalid or expired token",
            error: error.message,
        })
    }
})

// Logout route - keeping for backwards compatibility
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token")
    res.json({ message: "Logged out successfully" })
})

// Protected API routes
app.use("/api/accounts", require("./accounts/index.controller"))
app.use("/api/departments", authenticateToken, require("./departments"))
app.use("/api/employees", authenticateToken, require("./employees"))
app.use("/api/requests", authenticateToken, require("./requests"))
app.use("/api/workflows", authenticateToken, require("./workflows"))

// Add non-API versions for compatibility
app.use("/accounts", require("./accounts/index.controller"))
app.use("/departments", authenticateToken, require("./departments"))
app.use("/employees", authenticateToken, require("./employees"))
app.use("/requests", authenticateToken, require("./requests"))
app.use("/workflows", authenticateToken, require("./workflows"))

// Error handler
app.use((err, req, res, next) => {
    // Always return JSON, never HTML
    res.setHeader("Content-Type", "application/json")

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    })
})

// Handle 404 errors as JSON
app.use((req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.status(404).json({ message: "Route not found" })
})

// Start server
const port = process.env.PORT || 3000

async function startServer() {
    try {
        // Initialize database (just creates the database if it doesn't exist)
        await initializeDatabase()

        // No need to replace db.sequelize - it's already properly set up in _helpers/db.js
        // db.sequelize = await createPool(); ← This was causing the error

        // Sync database using the existing Sequelize instance
        await db.sequelize.sync({ force: false })

        // Start server
        app.listen(port, () => {
            // Server running on port message removed

            // Create default admin user if it doesn't exist
            db.User.findOrCreate({
                where: { email: "admin@example.com" },
                defaults: {
                    title: "Mr", // Explicitly set title
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    password: "admin", // In production, hash this password
                    role: "Admin",
                    status: "Active",
                },
            }).then(([user, created]) => {
                // Update title if needed
                if (!created && (!user.title || user.title === "")) {
                    user.update({ title: "Mr" })
                        .then(() => {
                            // Update message removed
                        })
                        .catch(() => {
                            // Error message removed
                        })
                }
            })
        })

        return "Server initialized"
    } catch (error) {
        // Just rethrow the error instead of logging it
        throw error
    }
}

startServer().catch(() => {
    process.exit(1)
})
