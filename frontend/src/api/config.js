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

// Allow runtime changes to this value
if (typeof window !== "undefined") {
    Object.defineProperty(window, "USE_FAKE_BACKEND", {
        get: () => USE_FAKE_BACKEND,
        set: value => {
            setBackendMode(value)
        },
    })
}
