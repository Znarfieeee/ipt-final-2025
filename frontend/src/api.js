// Create a new file to handle authentication and API status
import { USE_FAKE_BACKEND } from "./api/config"

export const useApi = backend => {
    const isAuthenticated = () => {
        // First check if token exists in localStorage
        const token = localStorage.getItem("token")
        return !!token // Return true if token exists
    }

    const getUserData = () => {
        try {
            // Get user data from local storage or use backend if available
            const userData = localStorage.getItem("userData")
            return userData ? JSON.parse(userData) : null
        } catch (error) {
            console.error("Error parsing user data:", error)
            return null
        }
    }

    const setUserData = data => {
        try {
            localStorage.setItem("userData", JSON.stringify(data))
        } catch (error) {
            console.error("Error storing user data:", error)
        }
    }

    // Using backend parameter to determine if we're using fake backend
    const isFakeMode = () => {
        return USE_FAKE_BACKEND
    }

    return {
        isAuthenticated,
        getUserData,
        setUserData,
        isFakeMode,
    }
}
