const nodeMailer = require("nodemailer")
const config = require("../config")

module.exports = sendEmail

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    try {
        const transporter = nodeMailer.createTransport(config.smtpOptions)
        const info = await transporter.sendMail({ from, to, subject, html })

        console.log("Email sent successfully!")

        // Get the preview URL from nodemailer (for Ethereal emails)
        const previewUrl = nodeMailer.getTestMessageUrl(info)
        console.log("Preview URL: %s", previewUrl)

        // Return the info object with the preview URL
        return {
            ...info,
            previewUrl,
        }
    } catch (error) {
        console.error("Error sending email:", error)
        throw error
    }
}
