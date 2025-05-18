import React, { useRef, useState, useEffect } from "react"
<<<<<<< HEAD
import { Link, useNavigate, useLocation } from "react-router-dom"
=======
import { useNavigate } from "react-router-dom"
>>>>>>> b70771eea3f758d762b4bcf97f2fac0750b298d1
import { showToast } from "../util/alertHelper"
import { USE_FAKE_BACKEND } from "../api/config"
import useFakeBackend from "../api/fakeBackend"
import LoadingButton from "../components/LoadingButton"
import { useAuth } from "../context/AuthContext"
import backendConnection from "../api/BackendConnection"

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [needsVerification, setNeedsVerification] = useState(false)
    const [verificationLoading, setVerificationLoading] = useState(false)
    const [bypassLoading, setBypassLoading] = useState(false)
    const { fakeFetch } = useFakeBackend()
    const { login } = useAuth()

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token")
        const userInfo = localStorage.getItem("userInfo")

        if (token && userInfo) {
            // User is already logged in, redirect to home
            navigate("/")
        }
    }, [navigate])

    // Check for message from registration or verification success
    useEffect(() => {
        if (location.state?.message) {
            // Set verification details if available
            if (location.state.verificationDetails) {
                setNeedsVerification(true)

                // Set message with email preview link if available
                setMessage(
                    <>
                        {location.state.message}
                        {location.state.verificationDetails?.emailPreviewUrl && (
                            <div className="mt-2 flex items-center justify-between">
                                <a
                                    href={location.state.verificationDetails.emailPreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium underline"
                                >
                                    View Email Preview
                                </a>
                                <button
                                    onClick={() => handleBypassVerification(location.state.verificationDetails?.email)}
                                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                                    disabled={bypassLoading}
                                >
                                    {bypassLoading ? "Processing..." : "Bypass Verification"}
                                </button>
                            </div>
                        )}
                    </>
                )
            } else {
                setMessage(location.state.message)
            }

            // Clear the state after displaying the message
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate, bypassLoading])

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token")
        const userInfo = localStorage.getItem("userInfo")

        if (token && userInfo) {
            // User is already logged in, redirect to home
            navigate("/")
        }
    }, [navigate])

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setNeedsVerification(false)

        try {
            const email = emailRef.current.value
            const password = passwordRef.current.value

            if (USE_FAKE_BACKEND) {
                // Use the fake backend for login
                const response = await fakeFetch(`http://localhost:3000/accounts/authenticate`, {
                    method: "POST",
                    body: { email, password },
                })
                const result = await response.json()

                if (response.ok) {
                    // Use the auth context login function
                    await login(email, password)
                    showToast("success", "Login successful")
                    navigate("/")
                } else {
                    setError(result.message || "Invalid credentials")
                    showToast("error", result.message || "Invalid credentials.")

                    // Check if needs verification
                    if (
                        result.message &&
                        (result.message.toLowerCase().includes("not verified") ||
                            result.message.toLowerCase().includes("verify your email") ||
                            result.message.toLowerCase().includes("verification") ||
                            result.message.toLowerCase().includes("email is not verified"))
                    ) {
                        setNeedsVerification(true)
                        // Set a more user-friendly error message
                        setError("Your account needs to be verified before you can log in.")
                    }
                }
            } else {
                try {
<<<<<<< HEAD
                    // Use the auth context login function
                    await login(email, password)
                    showToast("success", "Login successful")
                    navigate("/")
=======
                    // Use direct fetch for more reliable login
                    const response = await fetch(`${backendConnection.getBaseUrl()}/api/auth/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: "include", // Important for cookies
                    })

                    if (!response.ok) {
                        // Try to get error message
                        let errorMessage = "Login failed"
                        try {
                            const errorData = await response.json()
                            errorMessage = errorData.message || errorData.error || errorMessage
                        } catch {
                            errorMessage = "Server error: " + response.status
                        }
                        throw new Error(errorMessage)
                    }

                    const result = await response.json()

                    // Store authentication info
                    if (result.token) {
                        localStorage.setItem("token", result.token)
                        if (result.user) {
                            localStorage.setItem("userInfo", JSON.stringify(result.user))
                        }
                        showToast("success", "Login successful")
                        navigate("/")
                    } else {
                        throw new Error("Invalid response from server")
                    }
>>>>>>> b70771eea3f758d762b4bcf97f2fac0750b298d1
                } catch (loginError) {
                    console.error("Direct login error:", loginError)
                    setError(loginError.message)
                    showToast("error", loginError.message)
<<<<<<< HEAD

                    // Check if needs verification
                    if (
                        loginError.message &&
                        (loginError.message.toLowerCase().includes("not verified") ||
                            loginError.message.toLowerCase().includes("verify your email") ||
                            loginError.message.toLowerCase().includes("verification") ||
                            loginError.message.toLowerCase().includes("email is not verified"))
                    ) {
                        setNeedsVerification(true)
                        // Set a more user-friendly error message
                        showToast("error", "Your account needs to be verified before you can log in.")
                    }
=======
>>>>>>> b70771eea3f758d762b4bcf97f2fac0750b298d1
                }
            }
        } catch (err) {
            console.error("Login error:", err)
            setError(err.message || "Unknown error")
            showToast("error", "Login failed: " + (err.message || "Unknown error"))

            // Check if needs verification
            if (
                err.message &&
                (err.message.toLowerCase().includes("not verified") ||
                    err.message.toLowerCase().includes("verify your email") ||
                    err.message.toLowerCase().includes("verification") ||
                    err.message.toLowerCase().includes("email is not verified"))
            ) {
                setNeedsVerification(true)
                // Set a more user-friendly error message
                setError("Your account needs to be verified before you can log in.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!emailRef.current.value) {
            setError("Please enter your email address to resend verification")
            return
        }

        setVerificationLoading(true)
        try {
            // Call an API endpoint to resend verification email
            const result = await backendConnection.resendVerification(emailRef.current.value)

            // Set success message with email preview link if available
            setMessage(
                <>
                    Verification email has been resent. Please check your email for verification instructions.
                    {result.verificationDetails?.emailPreviewUrl && (
                        <div className="mt-2 flex items-center gap-3">
                            <a
                                href={result.verificationDetails.emailPreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline"
                            >
                                View Email Preview
                            </a>
                            <button
                                onClick={() => handleBypassVerification(emailRef.current.value)}
                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                                disabled={bypassLoading}
                            >
                                {bypassLoading ? "Processing..." : "Bypass Verification"}
                            </button>
                        </div>
                    )}
                </>
            )

            setError("")
            showToast("success", "Verification email sent")
        } catch (err) {
            setError("Failed to resend verification: " + (err.message || "Unknown error"))
            showToast("error", "Failed to resend verification")
        } finally {
            setVerificationLoading(false)
        }
    }

    const handleBypassVerification = async email => {
        const userEmail = email || emailRef.current.value

        if (!userEmail) {
            setError("Please enter your email address to bypass verification")
            return
        }

        setBypassLoading(true)
        try {
            // Call the bypass verification endpoint
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
                setMessage("Email verification bypassed successfully! You can now log in.")
                setNeedsVerification(false)
                showToast("success", "Email verification bypassed successfully")

                // If already verified, show appropriate message
                if (result.alreadyVerified) {
                    showToast("info", "This account is already verified")
                }
            } else {
                throw new Error(result.message || "Failed to bypass verification")
            }
        } catch (err) {
            setError("Failed to bypass verification: " + (err.message || "Unknown error"))
            showToast("error", "Failed to bypass verification")
        } finally {
            setBypassLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>

                    {message && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-600 rounded">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded">{error}</div>
                    )}

                    {needsVerification && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded">
                            <p className="font-medium mb-2">Email verification required</p>
                            <p className="text-sm mb-3">
                                Your account needs to be verified. Please check your email for verification
                                instructions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <LoadingButton
                                    onClick={handleResendVerification}
                                    isLoading={verificationLoading}
                                    loadingText="Sending..."
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                                >
                                    Resend verification email
                                </LoadingButton>
                            </div>
                        </div>
                    )}
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md space-y-3">
                        <div className="flex flex-col gap-px">
                            <label htmlFor="email" className="">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                ref={emailRef}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="(admin@example.com)"
                            />
                        </div>
                        <div className="flex flex-col gap-px">
                            <label htmlFor="password" className="">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                ref={passwordRef}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="(admin)"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <LoadingButton
                            type="submit"
                            isLoading={loading}
                            loadingText="Signing in..."
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Sign in
                        </LoadingButton>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
