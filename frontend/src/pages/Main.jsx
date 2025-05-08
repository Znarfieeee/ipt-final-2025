import React from "react"
import { useLocation } from "react-router-dom"

const Main = () => {
    const location = useLocation()
    const path = location.pathname.substring(1) || "dashboard"

    return (
        <div className="container mx-auto">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4 capitalize">
                    {path === "" ? "Dashboard" : path}
                </h1>
                <p className="text-gray-600">
                    This is the {path === "" ? "Dashboard" : path} page. Content
                    for this section is under development.
                </p>

                <div className="mt-8 p-4 bg-blue-50 rounded-md">
                    <p className="text-blue-800">
                        Welcome to the HR Management System. Navigate using the
                        menu above.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Main
