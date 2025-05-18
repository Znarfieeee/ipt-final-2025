/**
 * Utility script to fix verification data for existing users
 * - Set verified status for all active users
 * - Set verification tokens for inactive users
 */
const db = require("../_helpers/db")
const crypto = require("crypto")

// Function to generate a random token
function generateToken() {
    return crypto.randomBytes(40).toString("hex")
}

async function fixVerificationData() {
    try {
        console.log("Starting verification data fix...")

        // Get all users
        const users = await db.User.findAll()
        console.log(`Found ${users.length} users to process`)

        for (const user of users) {
            // If user is Active but not verified, mark them as verified
            if (user.status === "Active" && !user.verified) {
                user.verified = new Date()
                user.verificationToken = null
                await user.save()
                console.log(`Marked active user as verified: ${user.email}`)
            }

            // If user is Inactive and has no verification token, generate one
            if (user.status === "Inactive" && !user.verificationToken) {
                user.verificationToken = generateToken()
                await user.save()
                console.log(`Generated token for inactive user: ${user.email}`)
            }
        }

        console.log("Verification data fix completed!")
    } catch (err) {
        console.error("Error fixing verification data:", err)
    } finally {
        // Close the connection
        await db.sequelize.close()
    }
}

// Run the function if executed directly
if (require.main === module) {
    fixVerificationData().catch(err => {
        console.error("Failed to fix verification data:", err)
        process.exit(1)
    })
}
