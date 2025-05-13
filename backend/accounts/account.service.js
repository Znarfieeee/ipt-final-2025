const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const db = require("../_helpers/db")

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
}

async function authenticate({ email, password }) {
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
        throw new Error("User not found")
    }

    // For development, accept any password
    // In production, use this:
    // const isValid = await bcrypt.compare(password, user.password);
    // if (!isValid) {
    //     throw new Error('Invalid password');
    // }

    // Generate token
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.Employee?.id,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
    )

    return {
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
    }
}

async function getAll() {
    return await db.User.findAll({
        attributes: { exclude: ["password"] },
        include: [
            {
                model: db.Employee,
                attributes: ["id", "employeeId", "position"],
            },
        ],
    })
}

async function getById(id) {
    const user = await db.User.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
            {
                model: db.Employee,
                attributes: ["id", "employeeId", "position"],
            },
        ],
    })
    if (!user) throw new Error("User not found")
    return user
}

async function create(params) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw new Error("Email already registered")
    }

    const user = new db.User(params)

    // hash password
    if (params.password) {
        user.password = await bcrypt.hash(params.password, 10)
    }

    // save user
    await user.save()

    return { ...user.get(), password: undefined }
}

async function update(id, params) {
    const user = await db.User.findByPk(id)

    if (!user) throw new Error("User not found")

    // validate email if changed
    if (
        params.email &&
        user.email !== params.email &&
        (await db.User.findOne({ where: { email: params.email } }))
    ) {
        throw new Error("Email already registered")
    }

    // hash password if it was entered
    if (params.password) {
        params.password = await bcrypt.hash(params.password, 10)
    }

    // copy params to user and save
    Object.assign(user, params)
    await user.save()

    return { ...user.get(), password: undefined }
}

async function _delete(id) {
    const user = await db.User.findByPk(id)
    if (!user) throw new Error("User not found")
    await user.destroy()
}
