import React, { useRef, useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { showToast } from "../util/alertHelper"
import { USE_FAKE_BACKEND } from "../api/config"
import useFakeBackend from "../api/fakeBackend"
import backendConnection from "../api/BackendConnection"
import LoadingButton from "../components/LoadingButton"

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const { fakeFetch } = useFakeBackend()

    // Check for message from registration or verification success
    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message)
            // Clear the state after displaying the message
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate])

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const email = emailRef.current.value
            const password = passwordRef.current.value

            if (USE_FAKE_BACKEND) {
                // Use the fake backend for login
                const response = await fakeFetch(`http://localhost:3000/api/auth/login`, {
                    method: "POST",
                    body: { email, password },
                })
                const result = await response.json()

                if (response.ok) {
                    // Store token in localStorage for future API calls
                    localStorage.setItem("token", result.token)
                    localStorage.setItem("userInfo", JSON.stringify(result.user))
                    showToast("success", "Login successful")
                    navigate("/")
                } else {
                    setError(result.message || "Invalid credentials")
                    showToast("error", result.message || "Invalid credentials.")
                }
            } else {
                // Use the real backend through BackendConnection
                const result = await backendConnection.login(email, password)

                if (result) {
                    showToast("success", "Login successful")
                    navigate("/")
                } else {
                    setError("Login failed. Please check your credentials.")
                    showToast("error", "Login failed. Please check your credentials.")
                }
            }
        } catch (err) {
            console.error("Login error:", err)
            setError(err.message || "Unknown error")
            showToast("error", "Login failed: " + (err.message || "Unknown error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {USE_FAKE_BACKEND ? "(Using Fake Backend)" : "(Using Real Backend)"}
                    </p>
                    
                    {message && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 text-green-600 rounded">{message}</div>
                    )}
                    
                    {error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-600 rounded">{error}</div>
                    )}
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
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
                                placeholder="Email address"
                                defaultValue="admin@example.com" // For easy testing
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
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
                                placeholder="Password"
                                defaultValue="admin" // For easy testing
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
