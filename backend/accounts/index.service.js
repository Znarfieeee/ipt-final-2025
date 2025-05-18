const config = require("../config.js")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { Op } = require("sequelize")
const db = require("../_helpers/db")
const Role = require("../_helpers/role")
const sendEmailHelper = require("../_helpers/send-email")

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    resendVerificationEmail,
    changePassword,
    getRefreshTokens,
    revokeRefreshToken,
    revokeAllRefreshTokens,
    bypassVerification,
}

async function authenticate({ email, password, ipAddress }) {
    try {
        // Special case for admin user when database might be unavailable
        if (email === "admin@example.com") {
            // For the admin user, we'll be more lenient with authentication
            // Create a mock account for admin
            const adminAccount = {
                id: 1,
                title: "Mr",
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                password:
                    "$2a$10$DxyLmSqnjZ2QGnlvlIVnpushz2TwX/vNxRwjvnb.CyzVoQXfJaVQy", // hashed 'admin'
                role: "Admin",
                status: "Active",
                verified: new Date(),
                isVerified: function () {
                    return true
                },
            }

            // For development, accept password 'admin' for admin user
            const isAdminPassword =
                password === "admin" ||
                (await bcrypt.compare(password, adminAccount.password))

            if (!isAdminPassword) {
                throw new Error("Password is incorrect")
            }

            // authentication successful so generate jwt tokens for admin
            const jwtToken = jwt.sign(
                {
                    sub: adminAccount.id,
                    id: adminAccount.id,
                    role: adminAccount.role,
                },
                config.secret,
                { expiresIn: "15m" }
            )

            // Return admin response
            return {
                ...basicDetails(adminAccount),
                jwtToken,
                refreshToken: randomTokenString(),
            }
        }

        // Regular authentication flow for non-admin users
        const account = await db.User.findOne({
            where: { email },
        })

        if (!account) {
            throw new Error("Email does not exist")
        }

        // Check if account is verified - clear error message
        if (!account.verified) {
            throw new Error(
                "Your email is not verified. Please check your email for verification instructions or request a new verification link."
            )
        }

        // Check if account is active
        if (account.status !== "Active") {
            throw new Error(
                "Your account is inactive or suspended. Please contact support for assistance."
            )
        }

        // For development, accept any password
        // In production, use this:
        if (!(await bcrypt.compare(password, account.password))) {
            throw new Error("Password is incorrect")
        }

        // authentication successful so generate jwt and refresh tokens
        const jwtToken = generateJwtToken(account)
        const refreshToken = generateRefreshToken(account, ipAddress)

        // save refresh token
        try {
            await refreshToken.save()
        } catch (refreshError) {
            console.warn("Failed to save refresh token:", refreshError.message)
            // Continue anyway - the JWT token will still work for authentication
        }

        // return basic details and tokens
        return {
            ...basicDetails(account),
            jwtToken,
            refreshToken: refreshToken.token,
        }
    } catch (error) {
        throw new Error(`Authentication error: ${error.message}`)
    }
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token)
    const account = await refreshToken.getAccount()

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress)
    refreshToken.revoked = Date.now()
    refreshToken.revokedByIp = ipAddress
    refreshToken.replacedByToken = newRefreshToken.token
    await refreshToken.save()
    await newRefreshToken.save()

    // generate new jwt
    const jwtToken = generateJwtToken(account)

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token,
    }
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token)

    // revoke token and save
    refreshToken.revoked = Date.now()
    refreshToken.revokedByIp = ipAddress
    await refreshToken.save()
}

async function register(params, origin) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw new Error("Email already registered")
    }

    // create user object
    const user = new db.User({
        title: params.title,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        password: await hash(params.password),
        role: params.role || "User",
        status: "Inactive", // Start as inactive until email is verified
        verificationToken: randomTokenString(),
    })

    // save user
    await user.save()

    // send verification email and get preview URL
    const emailPreviewUrl = await sendVerificationEmail(user, origin)

    // Create verification URL for frontend
    const frontendUrl = origin || "http://localhost:5173"
    const verifyUrl = `${frontendUrl}/verify-email?token=${user.verificationToken}`

    return {
        message:
            "Registration successful! Please check your email for verification instructions",
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        // Include verification details for testing purposes
        verificationDetails: {
            verificationToken: user.verificationToken,
            verificationUrl: verifyUrl,
            apiEndpoint: "POST /api/auth/verify-email",
            apiBody: { token: user.verificationToken },
            emailPreviewUrl:
                emailPreviewUrl && typeof emailPreviewUrl === "string"
                    ? emailPreviewUrl
                    : null,
        },
    }
}

async function forgotPassword({ email }, origin) {
    const account = await db.User.findOne({ where: { email } })

    // always return ok response to prevent email enumeration
    if (!account) return

    // create reset token that expires after 24 hours
    account.resetToken = randomTokenString()
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await account.save()

    // send email
    await sendPasswordResetEmail(account, origin)

    return {
        message: "Please check your email for password reset instructions",
    }
}

async function validateResetToken({ token }) {
    const account = await db.User.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() },
        },
    })

    if (!account) throw "Invalid token"

    return account
}

async function getAll() {
    try {
        // Check if database connection is working
        try {
            await db.sequelize.authenticate()
        } catch (connError) {
            throw new Error(`Database connection error: ${connError.message}`)
        }

        // Fetch users with proper error handling
        const accounts = await db.User.findAll()

        // Extract basic details safely
        const result = accounts.map(account => {
            try {
                return basicDetails(account)
            } catch (detailError) {
                // Return minimal data when extraction fails
                return {
                    id: account.id || "unknown",
                    error: "Failed to extract full details",
                }
            }
        })

        return result
    } catch (error) {
        // Create a default admin user if there's an error (might be empty database)
        try {
            const adminUser = {
                id: 1,
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                role: "Admin",
                status: "Active",
            }
            return [adminUser]
        } catch (fallbackError) {
            throw new Error(
                `Critical error in user data access: ${error.message}`
            )
        }
    }
}

async function getById(id) {
    const account = await getAccount(id)
    return basicDetails(account)
}

async function create(params) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered'
    }

    // Create account with explicit fields
    const account = new db.User({
        title: params.title,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        role: params.role || "User",
        status: params.status || "Inactive", // Default to inactive for email verification
    })

    // For admin-created accounts, they can be instantly verified
    if (params.verified) {
        account.verified = Date.now()
        account.status = "Active" // Activate account if verified
    } else {
        // Generate verification token for email verification
        account.verificationToken = randomTokenString()
    }

    // hash password
    account.password = await hash(params.password)

    // save account
    await account.save()

    // If verification is needed, send verification email
    if (!params.verified && params.sendVerificationEmail !== false) {
        await sendVerificationEmail(account, params.origin)
    }

    return basicDetails(account)
}

async function update(id, params) {
    const account = await getAccount(id)

    // validate (if email was changed)
    if (params.email && account.email !== params.email) {
        const emailExists = await db.User.findOne({
            where: { email: params.email },
        })
        if (emailExists) {
            throw 'Email "' + params.email + '" is already taken'
        }
    }

    // hash password if it was entered
    if (params.password) {
        params.password = await hash(params.password)
    }

    // copy params to account and save
    Object.assign(account, params)
    account.updatedAt = Date.now()
    await account.save()

    return basicDetails(account)
}

async function _delete(id) {
    const account = await getAccount(id)
    await account.destroy()
}

async function getAccount(id) {
    const account = await db.User.findByPk(id)
    if (!account) throw "Account not found"
    return account
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } })
    if (!refreshToken || !refreshToken.isActive) throw "Invalid token"
    return refreshToken
}

async function hash(password) {
    return await bcrypt.hash(password, 10)
}

function generateJwtToken(account) {
    // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign(
        { sub: account.id, id: account.id, role: account.role },
        config.secret,
        {
            expiresIn: "15m",
        }
    )
}

function generateRefreshToken(account, ipAddress) {
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress,
    })
}

function randomTokenString() {
    return crypto.randomBytes(40).toString("hex")
}

function basicDetails(account) {
    const {
        id,
        title,
        firstName,
        lastName,
        email,
        role,
        status,
        created,
        updated,
        verified,
    } = account
    return {
        id,
        title,
        firstName,
        lastName,
        email,
        role,
        status,
        created,
        updated,
        isVerified: !!verified,
    }
}

async function verifyEmail(token) {
    const account = await db.User.findOne({
        where: { verificationToken: token },
    })

    if (!account) throw "Verification failed"

    account.verified = Date.now()
    account.verificationToken = null
    account.status = "Active" // Activate account after verification
    await account.save()

    return { message: "Verification successful, you can now login" }
}

async function resetPassword({ token, password }) {
    const account = await validateResetToken({ token })

    // update password and remove reset token
    account.password = await hash(password)
    account.resetToken = null
    account.resetTokenExpires = null
    await account.save()

    return { message: "Password reset successful, you can now login" }
}

async function sendVerificationEmail(account, origin) {
    // Create verification URL - use the frontend URL directly for better testing
    // Extract the real origin domain if it exists, otherwise use localhost
    let frontendUrl

    // Define the default frontend URLs
    const localFrontendUrl = "http://localhost:5173"
    const deployedFrontendUrl = "https://ipt-final-2025-espelita.onrender.com"

    console.log(`Origin received: ${origin || "none"}`)

    if (origin) {
        // If origin is provided, determine if it's a frontend or backend URL
        if (origin.includes("localhost")) {
            // Local development
            frontendUrl = localFrontendUrl
        } else if (origin.includes("onrender.com")) {
            // Deployed on render.com

            // Check if it's the backend URL
            if (origin.includes("-backend-")) {
                // Replace backend with frontend in the URL or use the known frontend URL
                frontendUrl = deployedFrontendUrl
                console.log(
                    `Detected backend URL, using frontend URL: ${frontendUrl}`
                )
            } else {
                // It's already a frontend URL
                frontendUrl = origin
                console.log(`Using provided frontend URL: ${frontendUrl}`)
            }
        } else {
            // Some other domain, use as is
            frontendUrl = origin
        }
    } else {
        // No origin provided, default to deployed frontend URL if in production, otherwise localhost
        frontendUrl =
            process.env.NODE_ENV === "production"
                ? deployedFrontendUrl
                : localFrontendUrl
        console.log(`No origin provided, defaulting to: ${frontendUrl}`)
    }

    const verifyUrl = `${frontendUrl}/verify-email?token=${account.verificationToken}`

    console.log(`Generated verification URL: ${verifyUrl}`)

    // Create email content
    const emailContent = `
      <h4>Verify Email</h4>
      <p>Thanks for registering!</p>
      <p>Please click the below link to verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `

    // Use the sendEmail function
    const sendEmailResult = await sendEmailHelper({
        to: account.email,
        subject: "Verify your email address",
        html: emailContent,
    })

    // Print the verification token for easier testing with direct API calls
    console.log(`
      Verification token: ${account.verificationToken}
      Verification URL: ${verifyUrl}
      API endpoint: POST /api/auth/verify-email
      Body: { "token": "${account.verificationToken}" }
    `)

    console.log("-----------------------------------------------")

    // Return the email preview URL if available
    return sendEmailResult?.previewUrl || true
}

async function sendPasswordResetEmail(account, origin) {
    // Simulate Ethereal SMTP email for testing
    console.log(`
    -------------- ETHEREAL EMAIL SERVICE --------------
    To: ${account.email}
    From: ${config.emailFrom}
    Subject: Reset your password
    Body:
    <h4>Reset Password</h4>
  `)

    // Create reset URL - use the frontend URL directly for better testing
    const frontendUrl = origin || "http://localhost:5173"
    const resetUrl = `${frontendUrl}/reset-password?token=${account.resetToken}`

    console.log(`
    <p>Please click the below link to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
  `)

    // Print the reset token for easier testing with direct API calls
    console.log(`
    Reset token: ${account.resetToken}
    API endpoint: POST /api/auth/reset-password
    Body: { "token": "${account.resetToken}", "password": "newpassword", "confirmPassword": "newpassword" }
  `)

    console.log("-----------------------------------------------")

    return true
}

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    try {
        // Use the sendEmail helper function
        const info = await sendEmailHelper({ to, subject, html, from })

        // Log success
        console.log(`
        -------------- ETHEREAL EMAIL SERVICE --------------
        From: ${from}
        To: ${to}
        Subject: ${subject}
        Body: ${html}
        ---------------------------------------
        `)

        // Extract any tokens from the email content for easier testing
        const tokenMatch = html.match(/token=([^"&]+)/)
        if (tokenMatch && tokenMatch[1]) {
            console.log(`
        Token found in email: ${tokenMatch[1]}
        Use this token to verify email or reset password via frontend or API
        ---------------------------------------
        `)
        }

        // Return the preview URL if available
        return {
            success: true,
            previewUrl: info?.previewUrl || null,
        }
    } catch (error) {
        console.error("Error in sendEmail:", error)
        return { success: false }
    }
}

async function resendVerificationEmail(email, origin) {
    const account = await db.User.findOne({ where: { email } })

    // Always return ok response to prevent email enumeration
    if (!account) {
        return {
            message:
                "If a verified account exists with this email, a verification link will be sent.",
        }
    }

    // Don't resend if already verified
    if (account.verified) {
        return { message: "This account is already verified. You can log in." }
    }

    // Generate new verification token
    account.verificationToken = randomTokenString()
    await account.save()

    // Send email with verification token and get preview URL
    const emailPreviewUrl = await sendVerificationEmail(account, origin)

    // Create verification URL for frontend using the same logic as in sendVerificationEmail
    // Define the default frontend URLs
    const localFrontendUrl = "http://localhost:5173"
    const deployedFrontendUrl = "https://ipt-final-2025-espelita.onrender.com"

    let frontendUrl

    if (origin) {
        // If origin is provided, determine if it's a frontend or backend URL
        if (origin.includes("localhost")) {
            // Local development
            frontendUrl = localFrontendUrl
        } else if (origin.includes("onrender.com")) {
            // Deployed on render.com

            // Check if it's the backend URL
            if (origin.includes("-backend-")) {
                // Replace backend with frontend in the URL or use the known frontend URL
                frontendUrl = deployedFrontendUrl
            } else {
                // It's already a frontend URL
                frontendUrl = origin
            }
        } else {
            // Some other domain, use as is
            frontendUrl = origin
        }
    } else {
        // No origin provided, default to deployed frontend URL if in production, otherwise localhost
        frontendUrl =
            process.env.NODE_ENV === "production"
                ? deployedFrontendUrl
                : localFrontendUrl
    }

    const verifyUrl = `${frontendUrl}/verify-email?token=${account.verificationToken}`

    return {
        message:
            "Verification email sent. Please check your email for the verification link.",
        // Include verification details for testing purposes
        verificationDetails: {
            verificationToken: account.verificationToken,
            verificationUrl: verifyUrl,
            apiEndpoint: "POST /api/auth/verify-email",
            apiBody: { token: account.verificationToken },
            emailPreviewUrl:
                emailPreviewUrl && typeof emailPreviewUrl === "string"
                    ? emailPreviewUrl
                    : null,
        },
    }
}

async function changePassword(id, currentPassword, newPassword) {
    const account = await getAccount(id)

    // Verify current password
    if (!(await bcrypt.compare(currentPassword, account.password))) {
        throw new Error("Current password is incorrect")
    }

    // Update password
    account.password = await hash(newPassword)
    await account.save()

    return { message: "Password changed successfully" }
}

async function getRefreshTokens(userId) {
    try {
        // Find all refresh tokens for the user
        const tokens = await db.RefreshToken.findAll({
            where: { accountId: userId },
            order: [["created", "DESC"]],
        })

        return tokens.map(token => ({
            id: token.id,
            token: token.token,
            expires: token.expires,
            created: token.created,
            createdByIp: token.createdByIp,
            isExpired: token.isExpired,
            isActive: token.isActive,
            revoked: token.revoked,
            revokedByIp: token.revokedByIp,
        }))
    } catch (error) {
        console.error("Error fetching refresh tokens:", error)
        // Return empty array if table doesn't exist or other error
        return []
    }
}

async function revokeRefreshToken(id, ipAddress) {
    try {
        const refreshToken = await db.RefreshToken.findByPk(id)

        if (!refreshToken) throw new Error("Token not found")

        // Revoke token
        refreshToken.revoked = Date.now()
        refreshToken.revokedByIp = ipAddress
        await refreshToken.save()

        return { message: "Token revoked" }
    } catch (error) {
        console.error("Error revoking token:", error)
        throw error
    }
}

async function revokeAllRefreshTokens(userId, ipAddress) {
    try {
        // Find all active tokens
        const tokens = await db.RefreshToken.findAll({
            where: {
                accountId: userId,
                revoked: null,
            },
        })

        // Revoke all tokens
        for (const token of tokens) {
            token.revoked = Date.now()
            token.revokedByIp = ipAddress
            await token.save()
        }

        return { message: "All tokens revoked" }
    } catch (error) {
        console.error("Error revoking all tokens:", error)
        throw error
    }
}

async function bypassVerification(email) {
    // Find the account by email
    const account = await db.User.findOne({ where: { email } })

    if (!account) {
        throw new Error("No account found with this email address")
    }

    // Check if already verified
    if (account.verified) {
        return {
            message: "This account is already verified. You can log in.",
            alreadyVerified: true,
        }
    }

    // Mark as verified
    account.verified = Date.now()
    account.verificationToken = null
    account.status = "Active" // Activate account after verification
    await account.save()

    console.log(`Email verification bypassed for user: ${email}`)

    return {
        message: "Email verification bypassed successfully. You can now login.",
        success: true,
    }
}
