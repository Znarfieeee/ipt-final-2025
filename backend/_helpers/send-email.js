const nodeMailer = require("nodemailer")
const config = require("../config")

module.exports = sendEmail

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    try {
        const transporter = nodeMailer.createTransport(config.smtpOptions)
        const info = await transporter.sendMail({ from, to, subject, html })

        console.log("Email sent successfully!")
        console.log("Preview URL: %s", nodeMailer.getTestMessageUrl(info))

        return info
    } catch (error) {
        console.error("Error sending email:", error)
        throw error
    }
}
