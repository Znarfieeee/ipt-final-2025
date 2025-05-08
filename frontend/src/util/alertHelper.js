/**
 * Utility for displaying toast notifications
 * This is a simple implementation that can be replaced with a real toast library like react-toastify
 */

export const showToast = (type, message) => {
    // In a real application, this would use a proper toast library
    // For now, we'll just use console and alert for simplicity

    if (type === "success") {
        console.log("✅ Success:", message)
        alert(`✅ Success: ${message}`)
    } else if (type === "error") {
        console.error("❌ Error:", message)
        alert(`❌ Error: ${message}`)
    } else if (type === "warning") {
        console.warn("⚠️ Warning:", message)
        alert(`⚠️ Warning: ${message}`)
    } else {
        console.info("ℹ️ Info:", message)
        alert(`ℹ️ Info: ${message}`)
    }
}
