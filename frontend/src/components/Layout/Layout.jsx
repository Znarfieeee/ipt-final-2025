import React from "react"
import { Outlet, Link, useNavigate, Navigate } from "react-router-dom"

const Layout = () => {
    const navigate = useNavigate()
    const token = localStorage.getItem("token")

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    // Redirect root path based on authentication
    if (window.location.pathname === "/") {
        return <Navigate to={token ? "/dashboard" : "/login"} replace />
    }

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-slate-800 px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link
                            to={token ? "/dashboard" : "/login"}
                            className="text-white text-2xl font-bold hover:text-blue-400 transition-colors"
                        >
                            HR Management
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {token ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/employees"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Employees
                                </Link>
                                <Link
                                    to="/departments"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Departments
                                </Link>
                                <Link
                                    to="/workflows"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Workflows
                                </Link>
                                <Link
                                    to="/requests"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Requests
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
            <main className="flex-1 bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default Layout
