import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"
import LoadingButton from "../components/LoadingButton"

function ResetPassword() {
    const location = useLocation()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    })

    // Extract token from query parameters
    const queryParams = new URLSearchParams(location.search)
    const token = queryParams.get("token")

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Validate token exists
        if (!token) {
            setError("Reset token is missing. Please use the link from your email.")
            setLoading(false)
            return
        }

        try {
            const result = await backendConnection.resetPassword(token, formData.password, formData.confirmPassword)
            
            setSuccess(true)
            showToast("success", result.message || "Password has been reset successfully")
            
            // Navigate to login after 3 seconds
            setTimeout(() => {
                navigate("/login")
            }, 3000)
        } catch (err) {
            setError(err.message || "Failed to reset password")
            showToast("error", err.message || "Failed to reset password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Reset Your Password
                    </h2>
                    
                    {error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-600 rounded">{error}</div>
                    )}
                    
                    {!token && !success && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 text-yellow-600 rounded">
                            No reset token found. Please use the link from your email.
                        </div>
                    )}
                    
                    {success ? (
                        <div className="mt-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <p className="mt-4 text-xl font-medium text-gray-900">Password Reset Successful</p>
                            <p className="mt-2 text-gray-600">Your password has been reset successfully. Redirecting to login page...</p>
                        </div>
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div className="mb-4">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="New password"
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div>
                                <LoadingButton
                                    type="submit"
                                    isLoading={loading}
                                    loadingText="Resetting password..."
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={!token}
                                >
                                    Reset Password
                                </LoadingButton>
                            </div>
                        </form>
                    )}
                    
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Remember your password?{" "}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword 