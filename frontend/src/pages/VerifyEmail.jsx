import React, { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import backendConnection from "../api/BackendConnection"
import { showToast } from "../util/alertHelper"

function VerifyEmail() {
    const [status, setStatus] = useState("verifying") // verifying, success, error, debug
    const [message, setMessage] = useState("")
    const [token, setToken] = useState("")
    const [email, setEmail] = useState("")
    const [debugInfo, setDebugInfo] = useState({})
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get token from query params
                const queryParams = new URLSearchParams(location.search)
                const token = queryParams.get("token")
                const email = queryParams.get("email") // Get email if available
                setToken(token)
                if (email) setEmail(email)

                if (!token) {
                    setStatus("error")
                    setMessage(
                        "Verification token is missing. Please check your email for the correct verification link."
                    )
                    return
                }

                console.log("Attempting to verify email with token:", token)

                // Collect some debug information
                const debug = {
                    currentUrl: window.location.href,
                    hostname: window.location.hostname,
                    backendUrl: backendConnection.getBaseUrl(),
                    token: token.substring(0, 10) + "...", // Only show part of the token for security
                }
                setDebugInfo(debug)

                // Call API to verify email
                const result = await backendConnection.verifyEmail(token)

                setStatus("success")
                setMessage(result.message || "Your email has been verified successfully. You can now log in.")
                showToast("success", "Email verified successfully")
            } catch (error) {
                console.error("Verification error:", error)
                setStatus("error")
                setMessage(error.message || "Email verification failed. Please request a new verification link.")
                showToast("error", error.message || "Email verification failed")
            }
        }

        verifyEmail()
    }, [location])

    const handleResendVerification = async () => {
        try {
            // Extract email from token or ask user
            let userEmail = email || prompt("Please enter your email address to resend verification:")

            if (!userEmail) {
                return
            }

            setStatus("verifying")
            setMessage("Sending new verification email...")

            await backendConnection.resendVerification(userEmail)
            setStatus("info")
            setMessage("A new verification email has been sent. Please check your inbox.")
            showToast("success", "Verification email sent")
        } catch (error) {
            setStatus("error")
            setMessage("Failed to resend verification: " + (error.message || "Unknown error"))
            showToast("error", "Failed to resend verification")
        }
    }

    const handleBypassVerification = async () => {
        try {
            // Ask for the email if we don't have it
            let userEmail = email || prompt("Please enter your email address to bypass verification:")

            if (!userEmail) {
                showToast("error", "Email is required to bypass verification")
                return
            }

            setStatus("verifying")
            setMessage("Bypassing email verification...")

            // Call the backend to bypass verification
            // We'll use the debug endpoint to find the user and then manually verify them
            const response = await fetch(`${backendConnection.getBaseUrl()}/api/auth/bypass-verification`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: userEmail }),
                credentials: "include",
            })

            const result = await response.json()

            if (response.ok) {
                setStatus("success")
                setMessage("Verification bypassed successfully! You can now log in.")
                showToast("success", "Email verification bypassed")
            } else {
                throw new Error(result.message || "Failed to bypass verification")
            }
        } catch (error) {
            console.error("Bypass verification error:", error)
            setStatus("error")
            setMessage("Failed to bypass verification: " + (error.message || "Unknown error"))
            showToast("error", error.message || "Failed to bypass verification")
        }
    }

    const goToLogin = () => {
        navigate("/login")
    }

    const toggleDebug = () => {
        if (status === "debug") {
            setStatus("error")
        } else {
            setStatus("debug")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Email Verification</h2>

                    {status === "verifying" && (
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">Verifying your email...</p>
                            <div className="mt-4 flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="mt-8">
                            <div className="bg-green-100 border border-green-300 text-green-600 p-4 rounded">
                                <p className="font-medium">{message}</p>
                                <div className="mt-3 text-sm border-t border-green-200 pt-2">
                                    <p className="text-gray-600">Having trouble with verification?</p>
                                    <button
                                        onClick={handleBypassVerification}
                                        className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                        Click here to bypass email verification
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={goToLogin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mt-8">
                            <div className="bg-red-100 border border-red-300 text-red-600 p-4 rounded">
                                <p className="font-medium">{message}</p>
                                {token && (
                                    <p className="mt-2 text-sm">
                                        Token:{" "}
                                        <span className="font-mono bg-gray-100 px-1">{token.substring(0, 20)}...</span>
                                    </p>
                                )}
                                <div className="mt-3 text-sm border-t border-red-200 pt-2">
                                    <p className="text-gray-600">Having trouble with verification?</p>
                                    <button
                                        onClick={handleBypassVerification}
                                        className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                        Click here to bypass email verification
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    <button onClick={toggleDebug} className="underline">
                                        Show technical details
                                    </button>
                                </p>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    onClick={handleResendVerification}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                    Resend Verification
                                </button>
                                <button
                                    onClick={goToLogin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    )}

                    {status === "debug" && (
                        <div className="mt-8">
                            <div className="bg-gray-100 border border-gray-300 text-gray-800 p-4 rounded">
                                <h3 className="font-bold">Technical Details</h3>
                                <pre className="mt-2 text-xs bg-gray-200 p-2 rounded overflow-auto">
                                    {JSON.stringify(debugInfo, null, 2)}
                                </pre>
                                <p className="mt-2 font-medium text-red-600">{message}</p>
                                <div className="mt-3 text-sm border-t border-gray-200 pt-2">
                                    <p className="text-gray-600">Having trouble with verification?</p>
                                    <button
                                        onClick={handleBypassVerification}
                                        className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                        Click here to bypass email verification
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    <button onClick={toggleDebug} className="underline">
                                        Hide technical details
                                    </button>
                                </p>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    onClick={handleResendVerification}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                    Resend Verification
                                </button>
                                <button
                                    onClick={goToLogin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    )}

                    {status === "info" && (
                        <div className="mt-8">
                            <div className="bg-blue-100 border border-blue-300 text-blue-600 p-4 rounded">
                                <p className="font-medium">{message}</p>
                                <div className="mt-3 text-sm border-t border-blue-200 pt-2">
                                    <p className="text-gray-600">Having trouble with verification?</p>
                                    <button
                                        onClick={handleBypassVerification}
                                        className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                        Click here to bypass email verification
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={goToLogin}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Go to Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
