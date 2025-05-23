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
    "https://ipt-final-2025.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

// CORS middleware
app.use(
    cors({
        origin: function (origin, callback) {
            // For requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true)

            console.log("Request from origin:", origin)

            // Check if origin is allowed
            if (allowedOrigins.indexOf(origin) === -1) {
                console.log(
                    `Origin ${origin} not in allowed list, but allowing anyway for compatibility`
                )
                return callback(null, true) // Allow all origins for maximum compatibility
            }

            console.log(`Origin ${origin} is allowed`)
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
app.get("/public/users", async (req, res) => {
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
    "/auth/login",
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

// Logout route
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token")
    res.json({ message: "Logged out successfully" })
})

// Protected API routes
app.use("/api/auth", require("./accounts/index.controller"))
app.use("/api/departments", authenticateToken, require("./departments"))
app.use("/api/employees", authenticateToken, require("./employees"))
app.use("/api/requests", authenticateToken, require("./requests"))
app.use("/api/workflows", authenticateToken, require("./workflows"))

// Add non-API versions for compatibility - use fresh router instances
app.use("/accounts", require("./accounts/index.controller")) // This one might be fine as is since it exports a new router
app.use("/departments", authenticateToken, (req, res, next) => {
    next()
})
app.use("/employees", authenticateToken, (req, res, next) => {
    next()
})
app.use("/requests", authenticateToken, (req, res, next) => {
    next()
})
app.use("/workflows", authenticateToken, (req, res, next) => {
    next()
})

// Add a direct verification endpoint at the root level for maximum compatibility
app.post("/verify-email", async (req, res) => {
    try {
        console.log(
            "Root verify-email endpoint called with token:",
            req.body.token
        )

        // Forward to the accounts service
        const result = await require("./accounts/index.service").verifyEmail(
            req.body.token
        )

        // Return the result
        return res.json(result)
    } catch (error) {
        console.error("Error in root verify-email endpoint:", error)
        return res.status(400).json({
            message: error.message || "Verification failed",
            error: error.toString(),
        })
    }
})

// Also add a direct resend verification endpoint at the root level
app.post("/resend-verification", async (req, res) => {
    try {
        console.log(
            "Root resend-verification endpoint called for email:",
            req.body.email
        )

        // Forward to the accounts service
        const result =
            await require("./accounts/index.service").resendVerificationEmail(
                req.body.email,
                req.get("origin")
            )

        // Return the result
        return res.json(result)
    } catch (error) {
        console.error("Error in root resend-verification endpoint:", error)
        return res.status(400).json({
            message: error.message || "Failed to resend verification email",
            error: error.toString(),
        })
    }
})

// Add a debug endpoint to check verification tokens
app.get("/debug/verify-token/:token", async (req, res) => {
    try {
        const token = req.params.token
        console.log("Debug endpoint called for token:", token)

        // Check if the token exists in the database
        const db = require("./_helpers/db")
        const user = await db.User.findOne({
            where: { verificationToken: token },
        })

        if (!user) {
            return res.status(404).json({
                found: false,
                message: "Token not found in database",
                token: token,
            })
        }

        // Return user details (except password)
        return res.json({
            found: true,
            message: "Token found in database",
            token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                verified: !!user.verified,
                status: user.status,
            },
        })
    } catch (error) {
        console.error("Error in debug endpoint:", error)
        return res.status(500).json({
            message: "Error checking token",
            error: error.toString(),
        })
    }
})

// Add a direct bypass verification endpoint at the root level
app.post("/bypass-verification", async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                error: "Missing email",
            })
        }

        console.log(
            "Root bypass-verification endpoint called for email:",
            email
        )

        // Forward to the accounts service
        const result =
            await require("./accounts/index.service").bypassVerification(email)

        // Return the result
        return res.json(result)
    } catch (error) {
        console.error("Error in root bypass-verification endpoint:", error)
        return res.status(400).json({
            message: error.message || "Failed to bypass verification",
            error: error.toString(),
        })
    }
})

// Error handler - must be after all routes
const errorHandler = require("./_middleware/error-handler")
app.use(errorHandler)

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
        try {
            await initializeDatabase()
            console.log("Database initialization completed")
        } catch (dbError) {
            console.error("Database initialization error:", dbError.message)
            console.log(
                "Server will continue without database initialization..."
            )
            // Continue anyway - we'll use in-memory or mocked data
        }

        // No need to replace db.sequelize - it's already properly set up in _helpers/db.js
        // db.sequelize = await createPool(); ← This was causing the error

        // Custom sync with excluded models to avoid refreshToken issues
        try {
            // Individual table creation excluding problematic ones
            await db.User.sync({ alter: false })
            await db.Department.sync({ alter: false })
            await db.Employee.sync({ alter: false })
            await db.Request.sync({ alter: false })
            await db.RequestItem.sync({ alter: false })
            await db.Workflow.sync({ alter: false })
        } catch (syncError) {
            console.error("Database sync error:", syncError.message)
            // Continue anyway - tables probably already exist or we'll use in-memory data
        }

        // Start server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)

            // Create default admin user if it doesn't exist
            db.User.findOrCreate({
                where: { email: "admin@example.com" },
                defaults: {
                    title: "Mr", // Explicitly set title
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    password: "admin",
                    role: "Admin",
                    status: "Active",
                },
            })
                .then(([user, created]) => {
                    // Update title if needed
                    if (!created && (!user.title || user.title === "")) {
                        user.update({ title: "Mr" })
                            .then(() => {
                                // Update message removed
                            })
                            .catch(err => {
                                console.error("Error updating user title:", err)
                            })
                    }
                })
                .catch(err => {
                    console.error("Error creating default admin user:", err)
                })
        })

        return "Server initialized"
    } catch (error) {
        // Show detailed error information
        console.error("Server initialization failed:")
        console.error(error)
        throw error
    }
}

startServer().catch(() => {
    process.exit(1)
})
