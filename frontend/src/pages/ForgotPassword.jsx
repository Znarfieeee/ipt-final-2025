import React, { useState } from "react"
import { Link } from "react-router-dom"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"
import LoadingButton from "../components/LoadingButton"

function ForgotPassword() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Validate email
            if (!email || !email.includes('@')) {
                throw new Error("Please enter a valid email address")
            }

            // Send request to backend
            await backendConnection.forgotPassword(email)
            
            setSuccess(true)
            showToast("success", "Password reset instructions sent to your email")
        } catch (err) {
            setError(err.message || "Failed to process your request")
            showToast("error", err.message || "Failed to process your request")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot Your Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                    
                    {error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-600 rounded">{error}</div>
                    )}
                </div>
                
                {success ? (
                    <div className="mt-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                            <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <p className="mt-4 text-xl font-medium text-gray-900">Check Your Email</p>
                        <p className="mt-2 text-gray-600">We've sent password reset instructions to {email}</p>
                        <div className="mt-6">
                            <Link 
                                to="/login" 
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Return to Login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>

                        <div>
                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                loadingText="Sending..."
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Send Reset Instructions
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
    )
}

export default ForgotPassword 