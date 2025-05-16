// Get the saved preference from localStorage or use default (false)
const getSavedBackendPreference = () => {
    const saved = localStorage.getItem("useFakeBackend")
    return saved !== null ? saved === "true" : false
}

// Set to false to use real backend, true to use fake backend
export let USE_FAKE_BACKEND = getSavedBackendPreference()

// Function to change backend mode and save to localStorage
export const setBackendMode = useFake => {
    USE_FAKE_BACKEND = useFake
    localStorage.setItem("useFakeBackend", useFake.toString())
    console.log(`Backend mode set to: ${useFake ? "FAKE" : "REAL"}`)
}

/**
 * MANUAL BACKEND MODE SWITCHING
 * -----------------------------
 * To manually switch between real and fake backend modes, you can:
 *
 * 1. BROWSER CONSOLE METHOD:
 *    Open the browser console and type:
 *    - To use fake backend: window.USE_FAKE_BACKEND = true
 *    - To use real backend: window.USE_FAKE_BACKEND = false
 *
 * 2. LOCAL STORAGE METHOD:
 *    In browser DevTools -> Application -> Local Storage:
 *    - Add/edit key: "useFakeBackend"
 *    - Set value to: "true" or "false"
 *    - Refresh the page
 *
 * 3. RELOAD REQUIRED:
 *    After changing the mode, the page needs to be refreshed to apply changes.
 */

// Allow runtime changes to this value
if (typeof window !== "undefined") {
    Object.defineProperty(window, "USE_FAKE_BACKEND", {
        get: () => USE_FAKE_BACKEND,
        set: value => {
            setBackendMode(value)
            // Add a reload notification
            console.log("⚠️ Please refresh the page to apply backend mode changes")
            // Automatically refresh after a short delay to apply changes
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        },
    })
}
