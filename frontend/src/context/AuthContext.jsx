import React, { createContext, useState, useContext, useEffect } from "react"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Function to validate token and handle expiration
    const validateToken = async () => {
        const token = localStorage.getItem("token")
        if (!token) {
            setUser(null)
            return false
        }

        try {
            // Use the backend connection's validateToken method instead
            const result = await backendConnection.validateToken()

            // If validation failed, the backend connection already handled clearing data
            if (!result || result.valid === false) {
                setUser(null)
                return false
            }

            // If we have an updated user from the validation, update the user in context
            if (result.user) {
                setUser(result.user)
                localStorage.setItem("userInfo", JSON.stringify(result.user))
            }

            return true
        } catch (_) {
            // The error is already handled in the backendConnection.validateToken method
            setUser(null)
            return false
        }
    }

    // Check if user is already logged in (token exists in localStorage)
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token")
            if (token) {
                try {
                    // Try to validate token if possible
                    const isValid = await validateToken().catch(() => false)

                    if (isValid) {
                        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
                        setUser(userInfo)
                    } else {
                        // If token validation fails, use stored user info as fallback
                        try {
                            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
                            setUser(userInfo)
                        } catch {
                            // Clear invalid data
                            localStorage.removeItem("token")
                            localStorage.removeItem("userInfo")
                        }
                    }
                } catch (error) {
                    console.error("Failed to restore authentication", error)
                    // Clear invalid tokens
                    localStorage.removeItem("token")
                    localStorage.removeItem("userInfo")
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    // Login function
    const login = async (email, password) => {
        try {
            setLoading(true)
            const response = await backendConnection.login(email, password)

            // Save token and user info
            localStorage.setItem("token", response.token)
            localStorage.setItem("userInfo", JSON.stringify(response.user))

            setUser(response.user)
            return response
        } catch (error) {
            showToast("error", "Login Failed")
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Logout function
    const logout = async () => {
        try {
            setLoading(true)
            await backendConnection.logout()
        } catch (error) {
            console.error("Logout error", error)
        } finally {
            // Clear user data regardless of API call success
            localStorage.removeItem("token")
            localStorage.removeItem("userInfo")
            setUser(null)
            setLoading(false)
        }
    }

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated,
                validateToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export default AuthContext
