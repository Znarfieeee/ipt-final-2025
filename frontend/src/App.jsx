import React, { useEffect } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AppProvider } from "./context/AppContext"
import Login from "./pages/Login"
import Accounts from "./pages/Accounts"
import Layout from "./components/Layout/Layout"
import Department from "./pages/Department"
import Employees from "./pages/Employees"
import Requests from "./pages/Requests"
import NotFound from "./pages/NotFound"
import Home from "./pages/Home"
import ProtectedRoute from "./components/ProtectedRoute"
import backendConnection from "./api/BackendConnection"

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: (
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Home />,
                },
                {
                    path: "accounts",
                    element: <Accounts />,
                },
                {
                    path: "employees",
                    element: <Employees />,
                },
                {
                    path: "departments",
                    element: <Department />,
                },
                {
                    path: "requests",
                    element: <Requests />,
                },
            ],
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            path: "*",
            element: <NotFound />,
        },
    ])

    // Setup token validation on regular intervals
    useEffect(() => {
        // Add listener for auth error events
        const handleAuthError = event => {
            console.log("Auth error detected:", event.detail)
            // Explicitly redirect to login on auth error
            localStorage.removeItem("token")
            localStorage.removeItem("userInfo")
            window.location.href = "/login"
        }
        window.addEventListener("auth:error", handleAuthError)

        // Validate token periodically
        const validateTokenInterval = setInterval(async () => {
            if (localStorage.getItem("token")) {
                try {
                    // Use the validateToken method which now handles all the error cases
                    const result = await backendConnection.validateToken()

                    // If token validation explicitly returns invalid status
                    if (!result || result.valid === false) {
                        console.log("Token validation failed, redirecting to login")

                        // Clean up any authentication data
                        localStorage.removeItem("token")
                        localStorage.removeItem("userInfo")

                        // Force navigation to login page
                        window.location.href = "/login"
                    }
                } catch (error) {
                    console.error("Token validation error:", error)

                    // Clean up any authentication data
                    localStorage.removeItem("token")
                    localStorage.removeItem("userInfo")

                    // Force navigation to login page
                    window.location.href = "/login"
                }
            }
        }, 5 * 60 * 1000) // Check every 5 minutes

        return () => {
            window.removeEventListener("auth:error", handleAuthError)
            clearInterval(validateTokenInterval)
        }
    }, [])

    return (
        <AppProvider>
            <RouterProvider router={router} />
        </AppProvider>
    )
}

export default App
