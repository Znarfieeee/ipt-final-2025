import React, { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"

function VerifyEmail() {
    const [status, setStatus] = useState("verifying") // verifying, success, error
    const [message, setMessage] = useState("")
    const location = useLocation()

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get token from query params
                const queryParams = new URLSearchParams(location.search)
                const token = queryParams.get("token")

                if (!token) {
                    setStatus("error")
                    setMessage("Verification token is missing")
                    return
                }

                // Call API to verify email
                const result = await backendConnection.verifyEmail(token)
                
                setStatus("success")
                setMessage(result.message || "Your email has been verified successfully. You can now log in.")
                showToast("success", "Email verified successfully")
            } catch (error) {
                setStatus("error")
                setMessage(error.message || "Email verification failed")
                showToast("error", error.message || "Email verification failed")
            }
        }

        verifyEmail()
    }, [location])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Email Verification
                    </h2>
                    
                    {status === "verifying" && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">Verifying your email...</p>
                            <div className="mt-4 flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        </div>
                    )}
                    
                    {status === "success" && (
                        <div className="mt-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <p className="mt-4 text-xl font-medium text-gray-900">{message}</p>
                            <div className="mt-6">
                                <Link 
                                    to="/login" 
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {status === "error" && (
                        <div className="mt-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <p className="mt-4 text-xl font-medium text-gray-900">Verification Failed</p>
                            <p className="mt-2 text-gray-600">{message}</p>
                            <div className="mt-6 flex flex-col space-y-3">
                                <Link 
                                    to="/login" 
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail 