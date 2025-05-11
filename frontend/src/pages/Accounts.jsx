import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import AccountsAddForm from "../components/AccountsAddEditForm"

const Accounts = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const { fakeFetch } = useFakeBackend()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fakeFetch("/accounts", {
                    method: "GET",
                    body: "",
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

    function handleStatus(status) {
        const statusStyles = {
            Active: "bg-green-400",
            Inactive: "bg-red-400",
            Pending: "bg-yellow-400",
            Suspended: "bg-gray-400",
        }

        return (
            <span className={`px-3 py-1 rounded-md text-md font-medium text-white ${statusStyles[status]}`}>
                {status}
            </span>
        )
    }

    const handleAdd = () => {
        setEditingUser(null)
        setShowForm(true)
    }

    const handleEdit = user => {
        setEditingUser(user)
        setShowForm(true)
    }

    const handleFormSubmit = async formData => {
        try {
            const method = editingUser ? "PUT" : "POST"
            const path = editingUser ? `/accounts/${editingUser.id}` : "/accounts"

            const response = await fakeFetch(path, {
                method,
                body: JSON.stringify(formData),
            })

            const data = await response.json()
            if (data.error) {
                throw new Error(data.error)
            }

            if (editingUser) {
                setUsers(users.map(u => (u.id === editingUser.id ? { ...data } : u)))
            } else {
                setUsers([...users, data])
            }

            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error saving user: ", err)
            setError(err.message)
        }
    }

    const handleFormCancel = () => {
        setShowForm(false)
        setEditingUser(null)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce200"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce400"></div>
                </div>
                <div className="text-center text-gray-500">Loading data...</div>
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
                <div id="table-header" className="flex flex-row justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold capitalize text-foreground">ACCOUNTS</h1>
                    <button
                        onClick={handleAdd}
                        className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                        Add Account
                    </button>
                </div>
                <hr className="mb-4" />
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                First Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Last Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users && users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {user.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {user.firstName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {user.lastName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {user.role}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        {handleStatus(user.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="bg-blue-500 px-3 text-md font-medium py-1 rounded-md text-white hover:bg-blue-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-destructive">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <AccountsAddForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={editingUser} />
            )}
        </>
    )
}

export default Accounts
