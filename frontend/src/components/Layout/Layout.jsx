import React from "react"
import { Outlet, Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import useBackend from "../../api/fakeBackendConnection"
import { useApi } from "../../api"
import { useAuth } from "../../context/AuthContext"

// Components
import { FaRegCircleUser } from "react-icons/fa6"
import { RiLogoutCircleLine } from "react-icons/ri"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showToast } from "../../util/alertHelper"

const Layout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const backend = useBackend()
    const api = useApi(backend)
    const { user, logout } = useAuth()

    // Redirect to login if not authenticated
    if (!api.isAuthenticated() && location.pathname !== "/login") {
        return <Navigate to="/login" replace />
    }

    // Redirect to dashboard if authenticated and on login page
    if (api.isAuthenticated() && location.pathname === "/login") {
        return <Navigate to="/" replace />
    }

    const handleLogout = async () => {
        try {
            await logout()
            showToast("success", "Logged out successfully!")
            navigate("/login")
        } catch (error) {
            console.error("Logout error:", error)
            showToast("error", "Logout failed. Please try again.")
        }
    }

    // Check if user is admin
    const isAdmin = user?.role === "Admin"

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-slate-800 px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link to="/" className="text-white text-2xl font-bold hover:text-blue-400 transition-colors">
                            IPT FINAL 2025
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {api.isAuthenticated() ? (
                            <>
                                {isAdmin && (
                                    <Link
                                        to="/accounts"
                                        className="text-gray-200 hover:text-blue-400 transition-colors"
                                    >
                                        Accounts
                                    </Link>
                                )}
                                <Link
                                    to={isAdmin ? "/employees/manage" : "/employees"}
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Employees
                                </Link>
                                <Link
                                    to={isAdmin ? "/departments/manage" : "/departments"}
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Departments
                                </Link>
                                <Link
                                    to={isAdmin ? "/requests/manage" : "/requests"}
                                    className="text-gray-200 hover:text-blue-400 transition-colors"
                                >
                                    Requests
                                </Link>

                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1 text-gray-200 hover:text-blue-400 transition-colors cursor-pointer">
                                        <FaRegCircleUser className="text-lg" />
                                        <span>Account</span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="cursor-pointer">
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="text-red-600 cursor-pointer"
                                        >
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-200 hover:text-blue-400 transition-colors">
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
