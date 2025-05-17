require("dotenv").config()

module.exports = {
    database: {
        host: process.env.DB_HOST,
        dialect: "mysql",
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
    secret: process.env.JWT_SECRET || "kayaRaLagiNi",
    emailFrom: "no-reply@iptfinal.com",
    smtpOptions: {
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: "jordane.cormier45@ethereal.email",
            pass: "UBxu9FJHAVC66Qyexf",
        },
    },
    development: {
        skipAuth: true,
        logLevel: "debug",
    },
}