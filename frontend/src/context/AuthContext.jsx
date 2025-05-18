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
        if (!token) return false

        try {
            // Call the backend to validate token
            const response = await fetch(`${backendConnection.getBaseUrl()}/api/auth/validate-token`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            })

            if (!response.ok) {
                // Token is invalid or expired
                localStorage.removeItem("token")
                localStorage.removeItem("userInfo")
                setUser(null)

                // Dispatch auth error event for global handling
                const authErrorEvent = new CustomEvent("auth:error", {
                    detail: { status: response.status, message: "Token validation failed" },
                })
                window.dispatchEvent(authErrorEvent)
                return false
            }

            // Parse the response to check valid status
            const data = await response.json()
            if (!data.valid) {
                console.log("Token invalid according to server")
                localStorage.removeItem("token")
                localStorage.removeItem("userInfo")
                setUser(null)

                // Dispatch auth error event for global handling
                const authErrorEvent = new CustomEvent("auth:error", {
                    detail: { status: 401, message: "Invalid token" },
                })
                window.dispatchEvent(authErrorEvent)
                return false
            }

            return true
        } catch (error) {
            console.error("Token validation error:", error)
            // On error, assume token is invalid
            localStorage.removeItem("token")
            localStorage.removeItem("userInfo")
            setUser(null)

            // Dispatch auth error event for global handling
            const authErrorEvent = new CustomEvent("auth:error", {
                detail: { status: 0, message: "Token validation error" },
            })
            window.dispatchEvent(authErrorEvent)
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
