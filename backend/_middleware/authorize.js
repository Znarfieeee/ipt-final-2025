const jwt = require("jsonwebtoken")
const { secret } = require("../config.json")
const db = require("../_helpers/db")

module.exports = authorize

function authorize(roles = []) {
    if (typeof roles === "string") {
        roles = [roles]
    }

    return [
        // authenticate JWT token and attach user to request object (req.user)
        async (req, res, next) => {
            const authHeader = req.headers.authorization

            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Unauthorized" })
            }

            const token = authHeader.split(" ")[1]

            try {
                const payload = jwt.verify(
                    token,
                    process.env.JWT_SECRET || "sample-key"
                )

                // get user with their role
                const user = await db.User.findByPk(payload.id)

                if (!user) {
                    return res.status(401).json({ message: "Unauthorized" })
                }

                // check if user's role is in the authorized roles
                if (roles.length && !roles.includes(user.role)) {
                    return res.status(403).json({ message: "Forbidden" })
                }

                req.user = user
                next()
            } catch (err) {
                console.error(err)
                return res.status(401).json({ message: "Unauthorized" })
            }
        },
    ]
}
