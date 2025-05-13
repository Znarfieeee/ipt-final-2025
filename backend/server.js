require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const db = require("./_helpers/db")

// Create Express app
const app = express()

// Middleware
app.use(helmet())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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
            process.env.JWT_SECRET || "your-secret-key"
        )
        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" })
    }
}

// Basic routes
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the API" })
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
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                })
            }

            // For development, accept any password for the demo
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    employeeId: user.Employee?.id,
                },
                process.env.JWT_SECRET || "your-secret-key",
                {
                    expiresIn: "24h",
                }
            )

            // Set cookie first
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            })

            // Then send response
            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    employeeId: user.Employee?.id,
                    position: user.Employee?.position,
                },
                token,
            })
        } catch (error) {
            console.error("Login error:", error)
            return res.status(500).json({
                success: false,
                message: "Error during login process",
            })
        }
    }
)

// Logout route
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token")
    res.status(200).json({ message: "Logged out successfully" })
})

// Protected API routes
app.use("/api/departments", authenticateToken, require("./departments"))
app.use("/api/employees", authenticateToken, require("./employees"))
app.use("/api/requests", authenticateToken, require("./requests"))
app.use("/api/workflows", authenticateToken, require("./workflows"))

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    })
})

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)

    // Sync database
    db.sequelize.sync().then(() => {
        console.log("Database synced")

        // Create default admin user if it doesn't exist
        db.User.findOrCreate({
            where: { email: "admin@example.com" },
            defaults: {
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                password: "admin", // In production, hash this password
                role: "Admin",
                status: "Active",
            },
        }).then(([user, created]) => {
            if (created) {
                console.log("Default admin user created")
            }
        })
    })
})
