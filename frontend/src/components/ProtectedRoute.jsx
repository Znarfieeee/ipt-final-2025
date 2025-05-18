import React, { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

/**
 * A wrapper component for routes that require authentication.
 * If the user is not authenticated, they are redirected to the login page.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, validateToken } = useAuth()
    const location = useLocation()

    // Validate token on route access
    useEffect(() => {
        const validateAuth = async () => {
            // Only check if we think we're authenticated
            if (isAuthenticated() && localStorage.getItem("token")) {
                try {
                    // Validate token explicitly
                    const isValid = await validateToken()

                    // If token is invalid, the validateToken method already
                    // triggered the auth:error event which App.jsx is listening for
                    if (!isValid) {
                        console.log("Token validation failed in ProtectedRoute")
                    }
                } catch (error) {
                    console.error("Token validation error in ProtectedRoute:", error)
                }
            }
        }

        validateAuth()
    }, [validateToken, isAuthenticated])

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Render children if authenticated
    return children
}

export default ProtectedRoute
