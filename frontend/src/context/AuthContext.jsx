import React, { createContext, useState, useContext, useEffect } from "react"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tokenValidated, setTokenValidated] = useState(false)

    // Function to validate token and handle expiration
    const validateToken = async () => {
        if (tokenValidated) {
            return !!user
        }

        const token = localStorage.getItem("token")
        if (!token) {
            setUser(null)
            setTokenValidated(true)
            return false
        }

        try {
            // Use the backend connection's validateToken method instead
            const result = await backendConnection.validateToken()

            // If validation failed, the backend connection already handled clearing data
            if (!result || result.valid === false) {
                setUser(null)
                setTokenValidated(true)
                return false
            }

            // If we have an updated user from the validation, update the user in context
            if (result.user) {
                setUser(result.user)
                localStorage.setItem("userInfo", JSON.stringify(result.user))
            }

            setTokenValidated(true)
            return true
        } catch (error) {
            // The error is already handled in the backendConnection.validateToken method
            console.error("Token validation error:", error)
            setUser(null)
            setTokenValidated(true)
            return false
        }
    }

    // Check if user is already logged in (token exists in localStorage)
    useEffect(() => {
        let isMounted = true

        const checkAuth = async () => {
            const token = localStorage.getItem("token")

            if (!token) {
                if (isMounted) {
                    setLoading(false)
                    setTokenValidated(true)
                }
                return
            }

            try {
                // Try to validate token if possible
                const result = await backendConnection.validateToken()

                if (!isMounted) return

                if (result && result.valid !== false) {
                    // Get user info from result or localStorage
                    const userInfo = result.user ? result.user : JSON.parse(localStorage.getItem("userInfo") || "{}")

                    if (userInfo && Object.keys(userInfo).length > 0) {
                        setUser(userInfo)
                    }
                } else {
                    // Clear invalid data if validation failed
                    localStorage.removeItem("token")
                    localStorage.removeItem("userInfo")
                    setUser(null)
                }
            } catch (error) {
                if (!isMounted) return
                console.error("Failed to restore authentication", error)
                // Clear invalid tokens
                localStorage.removeItem("token")
                localStorage.removeItem("userInfo")
                setUser(null)
            } finally {
                if (isMounted) {
                    setLoading(false)
                    setTokenValidated(true)
                }
            }
        }

        checkAuth()

        return () => {
            isMounted = false
        }
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
            setTokenValidated(true)
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
        // Clear user data immediately for instant UI feedback
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("userInfo")
        setUser(null)
        setTokenValidated(true)
        setLoading(false)

        // Call backend in background - don't await response
        try {
            backendConnection.logout().catch(err => {
                console.error("Background logout error:", err)
            })
        } catch (error) {
            console.error("Logout error:", error)
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
                setUser,
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
