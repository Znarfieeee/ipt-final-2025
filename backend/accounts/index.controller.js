const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const validateRequest = require("../_middleware/validate-request")
const authorize = require("../_middleware/authorize")
const Role = require("../_helpers/role")
const accountService = require("./index.service")
const Joi = require("joi")

// Validation schemas
const loginValidation = [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
]

const registerValidation = [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    body("role")
        .optional()
        .isIn([Role.Admin, Role.User])
        .withMessage("Invalid role"),
]

const updateValidation = [
    body("firstName")
        .optional()
        .notEmpty()
        .withMessage("First name cannot be empty"),
    body("lastName")
        .optional()
        .notEmpty()
        .withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().withMessage("Enter a valid email"),
    body("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    body("role")
        .optional()
        .isIn([Role.Admin, Role.User])
        .withMessage("Invalid role"),
]

// Routes
router.post("/authenticate", validateRequest(loginValidation), authenticate)
router.post("/register", validateRequest(registerValidation), register)
router.post("/verify-email", validateResetTokenSchema, verifyEmail)
router.post("/refresh-token", refreshToken)
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken)
router.get("/", authorize(Role.Admin), getAll)
router.get("/:id", authorize(), getById)
router.put("/:id", authorize(), updateValidation, update)
router.put("/:id/toggle-status", authorize(Role.Admin), toggleActiveStatus)
router.delete("/:id", authorize(), _delete)

// Additional routes for backward compatibility
router.post("/login", validateRequest(loginValidation), authenticate)
router.post(
    "/",
    authorize(Role.Admin),
    validateRequest(registerValidation),
    create
)

// Additional users routes to match frontend expectations - keeping for compatibility
router.get("/users", authorize(Role.Admin), getAll)
router.get("/users/:id", authorize(), getById)
router.post(
    "/users",
    authorize(Role.Admin),
    validateRequest(registerValidation),
    create
)
router.put("/users/:id", authorize(), updateValidation, update)
router.delete("/users/:id", authorize(), _delete)

// Adding account routes for compatibility - No authentication for testing
router.get("/accounts", authorize(), async (req, res) => {
    try {
        const accounts = await accountService.getAll()
        return res.status(200).json(accounts)
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching accounts",
            error: error.message || "Unknown error",
        })
    }
})

// Add root auth endpoint for compatibility
router.get("/", authorize(), async (req, res) => {
    try {
        const accounts = await accountService.getAll()
        return res.status(200).json(accounts)
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching accounts",
            error: error.message || "Unknown error",
        })
    }
})

// Special test endpoint that doesn't use authorization
router.get("/test-users", (req, res) => {
    try {
        accountService
            .getAll()
            .then(accounts => {
                return res.status(200).json(accounts)
            })
            .catch(error => {
                return res.status(500).json({
                    message: "Error fetching users",
                    error: error.toString(),
                })
            })
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.toString(),
        })
    }
})

module.exports = router

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    })
    validateRequest(req, next, schema)
}

function authenticate(req, res, next) {
    const { email, password } = req.body
    const ipAddress = req.ip
    accountService
        .authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken)
            return res.json(account)
        })
        .catch(next)
}

function refreshToken(req, res, next) {
    // Get token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken
    const ipAddress = req.ip

    if (!token) {
        return res.status(400).json({ message: "Refresh token is required" })
    }

    accountService
        .refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken)
            res.json(account)
        })
        .catch(next)
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty(""),
    })
    validateRequest(req, next, schema)
}

function revokeToken(req, res, next) {
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken
    const ipAddress = req.ip

    if (!token) return res.status(400).json({ message: "Token is required" })

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    accountService
        .revokeToken({ token, ipAddress })
        .then(() => res.json({ message: "Token revoked" }))
        .catch(next)
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        acceptTerms: Joi.boolean().valid(true).required(),
    })
    validateRequest(req, next, schema)
}

function register(req, res, next) {
    accountService
        .register(req.body, req.get("origin"))
        .then(result => res.json(result))
        .catch(next)
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
    })
    validateRequest(req, next, schema)
}

function validateResetToken(req, res, next) {
    accountService
        .validateResetToken(req.body)
        .then(() => res.json({ message: "Token is valid" }))
        .catch(next)
}

function getAll(req, res, next) {
    try {
        accountService
            .getAll()
            .then(accounts => {
                // Send the accounts data back with success status
                return res.status(200).json(accounts)
            })
            .catch(err => {
                // Return a more detailed error response
                if (
                    err.name === "SequelizeConnectionError" ||
                    err.name === "SequelizeConnectionRefusedError" ||
                    err.name === "SequelizeHostNotFoundError" ||
                    err.name === "SequelizeAccessDeniedError"
                ) {
                    return res.status(500).json({
                        message: "Database connection error",
                        details: err.message,
                    })
                }

                // Try to handle errors more gracefully
                if (typeof err === "string") {
                    return res.status(400).json({ message: err })
                }

                res.status(500).json({
                    message: "Failed to retrieve accounts",
                    details: err.message || "Unknown error",
                })
            })
    } catch (error) {
        res.status(500).json({
            message: "Internal server error in accounts controller",
            details: error.message || "Unknown error",
        })
    }
}

function getById(req, res, next) {
    // users can get their own account and admins can get any account
    if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    accountService
        .getById(req.params.id)
        .then(account => (account ? res.json(account) : res.sendStatus(404)))
        .catch(next)
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        role: Joi.string().valid(Role.Admin, Role.User).required(),
        isActive: Joi.boolean().default(true),
    })
    validateRequest(req, next, schema)
}

function create(req, res, next) {
    accountService
        .create(req.body)
        .then(account => res.json(account))
        .catch(next)
}

function updateSchema(req, res, next) {
    const schemaRules = {
        title: Joi.string().empty(""),
        firstName: Joi.string().empty(""),
        lastName: Joi.string().empty(""),
        email: Joi.string().email().empty(""),
        password: Joi.string().min(6).empty(""),
        confirmPassword: Joi.string().valid(Joi.ref("password")).empty(""),
        isActive: Joi.boolean().empty(""),
    }

    // only admins can update role
    if (req.user.role === Role.Admin) {
        schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty("")
    }

    const schema = Joi.object(schemaRules).with("password", "confirmPassword")
    validateRequest(req, next, schema)
}

function update(req, res, next) {
    // users can update their own account and admins can update any account
    if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    accountService
        .update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(err => {
            if (typeof err === "string") {
                return res.status(400).json({ message: err })
            }
            next(err)
        })
}

function toggleActiveStatus(req, res, next) {
    accountService
        .getById(req.params.id)
        .then(account => {
            return accountService.update(req.params.id, {
                isActive: !account.isActive,
            })
        })
        .then(account =>
            res.json({
                message: `User ${
                    account.isActive ? "activated" : "deactivated"
                } successfully`,
                account,
            })
        )
        .catch(next)
}

function _delete(req, res, next) {
    // users can delete their own account and admins can delete any account
    if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    accountService
        .delete(req.params.id)
        .then(() => res.json({ message: "Account deleted successfully" }))
        .catch(next)
}

// helper functions

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
    res.cookie("refreshToken", token, cookieOptions)
}

// Function to handle email verification
function verifyEmail(req, res, next) {
    accountService
        .verifyEmail(req.body.token)
        .then(() => res.json({ message: "Email verification successful" }))
        .catch(next)
}
