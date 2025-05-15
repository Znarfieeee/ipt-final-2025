import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import "../index.css"

// Components
import AccountsAddForm from "../components/AccountsAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"

// UI Libraries
import { IoAddSharp } from "react-icons/io5"
import { CiEdit } from "react-icons/ci"

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
                setLoading(true);
                const response = await fakeFetch("/accounts", {
                    method: "GET",
                    body: "",
                })

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }

                // Make sure we have valid data
                if (Array.isArray(data)) {
                    setUsers(data);
                } else if (data && typeof data === 'object') {
                    // If it's not an array but an object, wrap it
                    setUsers([data]);
                } else {
                    // Use fallback data if we couldn't get valid data
                    console.warn("Received invalid user data, using fallback");
                    setUsers([{
                        id: 1,
                        title: "Mr",
                        firstName: "Admin",
                        lastName: "User",
                        email: "admin@example.com",
                        role: "Admin",
                        status: "Active"
                    }]);
                }
                setError(null)
            } catch (err) {
                console.error("Error fetching users: ", err)
                // Use fallback data on error
                setUsers([{
                    id: 1,
                    title: "Mr",
                    firstName: "Admin",
                    lastName: "User",
                    email: "admin@example.com",
                    role: "Admin",
                    status: "Active"
                }]);
                setError("Could not load users from server. Using fallback data.")
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
        }

        return (
            <span className={`px-3 py-1 rounded-full text-md font-medium text-white ${statusStyles[status]}`}>
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
                    <ButtonWithIcon
                        icon={IoAddSharp}
                        text="Account"
                        tooltipContent="Add New Account"
                        onClick={handleAdd}
                        variant="primary"
                    />
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
                                        <ButtonWithIcon
                                            icon={CiEdit}
                                            text="Edit"
                                            tooltipContent="Edit Account"
                                            onClick={() => handleEdit(user)}
                                            variant="primary"
                                        />
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
