import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"

const Accounts = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { fakeFetch } = useFakeBackend()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Then fetch users with the token
                const response = await fakeFetch("/accounts", {
                    method: "GET",
                })

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }

                setUsers(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching users: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [fakeFetch])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p>Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-red-500">Error: {error}</p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div id="table-header" className="flex flex-row justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold capitalize">ACCOUNTS</h1>
                    <button
                        onClick={() => {
                            console.log("Add button clicked")
                        }}
                        className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                        Add Account
                    </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                First Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users && users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{user.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.firstName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.lastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-red-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default Accounts
