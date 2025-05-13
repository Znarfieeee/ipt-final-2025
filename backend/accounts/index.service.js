const config = require("config.json")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { Op } = require("sequelize")
const db = require("_helpers/db")
const Role = require("_helpers/role")

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
}

async function authenticate({ email, password, ipAddress }) {
    const account = await db.Account.scope("withHash").findOne({
        where: { email },
    })

    if (!account) {
        throw "Email does not exist"
    }

    if (!(await bcrypt.compare(password, account.passwordHash))) {
        throw "Password is incorrect"
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(account)
    const refreshToken = generateRefreshToken(account, ipAddress)

    // save refresh token
    await refreshToken.save()

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token,
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
    if (await db.Account.findOne({ where: { email: params.email } })) {
        return (
            json({ message: "Email already registered.", status: "error" }), 400
        )
    }

    // create account object
    const account = new db.Account(params)

    // first registered account is an admin
    const isFirstAccount = (await db.Account.count()) === 0
    account.role = isFirstAccount ? Role.Admin : Role.User
    account.verificationToken = randomTokenString()

    // set active by default
    account.isActive = true

    // hash password
    account.passwordHash = await hash(params.password)

    // If first account, mark as verified and skip email
    if (isFirstAccount) {
        account.verified = Date.now()
        await account.save()
        return {
            message: "Admin registration successful.",
            isFirstUser: true,
        }
    }

    // save account
    await account.save()

    // send email
    await sendVerificationEmail(account, origin)
    return {
        message: "Registration successful!",
        isFirstUser: false,
    }
}

async function forgotPassword({ email }, origin) {
    const account = await db.Account.findOne({ where: { email } })

    // always return ok response to prevent email enumeration
    if (!account) return

    // create reset token that expires after 24 hours
    account.resetToken = randomTokenString()
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await account.save()

    // send email
    await sendPasswordResetEmail(account, origin)
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() },
        },
    })

    if (!account) throw "Invalid token"

    return account
}

async function getAll() {
    const accounts = await db.Account.findAll()
    return accounts.map(x => basicDetails(x))
}

async function getById(id) {
    const account = await getAccount(id)
    return basicDetails(account)
}

async function create(params) {
    // validate
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered'
    }

    const account = new db.Account(params)
    account.verified = Date.now()

    // set active by default
    account.isActive = true

    // hash password
    account.passwordHash = await hash(params.password)

    // save account
    await account.save()

    return basicDetails(account)
}

async function update(id, params) {
    const account = await getAccount(id)

    // validate (if email was changed)
    if (
        params.email &&
        account.email !== params.email &&
        (await db.Account.findOne({ where: { email: params.email } }))
    ) {
        throw 'Email "' + params.email + '" is already taken'
    }

    // hash password if it was entered
    if (params.password) {
        params.passwordHash = await hash(params.password)
    }

    // copy params to account and save
    Object.assign(account, params)
    account.updated = Date.now()
    await account.save()

    return basicDetails(account)
}

async function _delete(id) {
    const account = await getAccount(id)
    await account.destroy()
}

async function getAccount(id) {
    const account = await db.Account.findByPk(id)
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
    return jwt.sign({ sub: account.id, id: account.id }, config.secret, {
        expiresIn: "15m",
    })
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
        created,
        updated,
        isVerified,
        isActive,
    } = account
    return {
        id,
        title,
        firstName,
        lastName,
        email,
        role,
        created,
        updated,
        isVerified,
        isActive,
    }
}
