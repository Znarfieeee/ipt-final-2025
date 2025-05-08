import React from "react"
import { Outlet, Link, useNavigate, Navigate, useLocation } from "react-router-dom"
import useBackend from "../../api/fakeBackendConnection"
import { useApi } from "../../api"

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

const Layout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const backend = useBackend()
    const api = useApi(backend)

    const handleLogout = async () => {
        await api.logout()
        navigate("/login")
    }

    // Redirect to login if not authenticated
    if (!api.isAuthenticated() && location.pathname !== "/login") {
        return <Navigate to="/login" replace />
    }

    // Redirect to dashboard if authenticated and on login page
    if (api.isAuthenticated() && location.pathname === "/login") {
        return <Navigate to="/" replace />
    }

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
                                <Link to="/" className="text-gray-200 hover:text-blue-400 transition-colors">
                                    Home
                                </Link>
                                <Link to="/employees" className="text-gray-200 hover:text-blue-400 transition-colors">
                                    Employees
                                </Link>
                                <Link to="/departments" className="text-gray-200 hover:text-blue-400 transition-colors">
                                    Departments
                                </Link>
                                <Link to="/workflows" className="text-gray-200 hover:text-blue-400 transition-colors">
                                    Workflows
                                </Link>
                                <Link to="/requests" className="text-gray-200 hover:text-blue-400 transition-colors">
                                    Requests
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <FaRegCircleUser className="text-white hover:text-blue-400 transition-colors cursor-pointer" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-gray-100">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="hover:bg-gray-400 hover:text-gray-100"
                                            onClick={handleLogout}
                                        >
                                            <RiLogoutCircleLine />
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
