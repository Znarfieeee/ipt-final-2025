const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const errorHandler = require("./_middleware/error-handler")
const validateRequest = require("./_middleware/validate-request")
const jwt = require("jsonwebtoken")

// Create Express app
const app = express()

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(
    cors({
        origin: "http://localhost:5173", // Frontend URL
        credentials: true,
    })
)

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.sendStatus(401)
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key",
        (err, user) => {
            if (err) {
                return res.sendStatus(403)
            }
            req.user = user
            next()
        }
    )
}

// Basic routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" })
})

// Auth routes
app.post("/api/auth/login", (req, res) => {
    // TODO: Implement actual authentication
    const { username, password } = req.body

    // Mock authentication
    if (username === "admin" && password === "admin") {
        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET || "your-secret-key"
        )
        res.json({ token })
    } else {
        res.status(401).json({ message: "Invalid credentials" })
    }
})

// Protected API routes
app.use("/api/departments", authenticateToken, require("./departments"))
app.use("/api/employees", authenticateToken, require("./employees"))
app.use("/api/requests", authenticateToken, require("./requests"))
app.use("/api/workflows", authenticateToken, require("./workflows"))

// Global error handler
app.use(errorHandler)

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})
