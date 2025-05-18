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
                    setMessage("Verification token is missing. Please check your email for the correct verification link.")
                    return
                }

                // Call API to verify email
                const result = await backendConnection.verifyEmail(token)
                
                setStatus("success")
                setMessage(result.message || "Your email has been verified successfully. You can now log in.")
                showToast("success", "Email verified successfully")
            } catch (error) {
                setStatus("error")
                setMessage(error.message || "Email verification failed. Please request a new verification link.")
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
                            <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="font-medium mb-2">Verification Successful!</p>
                                <p>{message}</p>
                                <div className="mt-4">
                                    <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                                        Go to Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {status === "error" && (
                        <div className="mt-8 text-center">
                            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <p className="font-medium mb-2">Verification Failed</p>
                                <p>{message}</p>
                                <div className="mt-4 flex justify-center space-x-4">
                                    <Link to="/login" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded">
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail 