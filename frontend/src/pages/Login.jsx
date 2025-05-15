import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { showToast } from "../util/alertHelper"
import { USE_FAKE_BACKEND } from "../api/config"
import useFakeBackend from "../api/fakeBackend"
import { useAuth } from "../context/AuthContext"

function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const { fakeFetch } = useFakeBackend()
    const { login } = useAuth() // Use the auth context

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)

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
                    showToast("error", "Invalid credentials.")
                }
            } else {
                // Use the real backend through auth context
                await login(email, password)
                showToast("success", "Login successful")
                navigate("/")
            }
        } catch (err) {
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

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login
