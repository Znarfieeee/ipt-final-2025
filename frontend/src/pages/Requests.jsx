import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import "../index.css"

// Components
import RequestAddForm from "../components/RequestAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"

// UI Libraries
import { IoAddSharp } from "react-icons/io5"
import { CiEdit } from "react-icons/ci"

function Requests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingRequest, setEditingRequest] = useState(null)
    const { fakeFetch } = useFakeBackend()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch requests, employees and users data
                const [requestsResponse, usersResponse] = await Promise.all([
                    fakeFetch("/requests", {
                        method: "GET",
                        body: "",
                    }),
                    fakeFetch("/accounts", {
                        method: "GET",
                        body: "",
                    }),
                ])

                const requestsData = await requestsResponse.json()
                const usersData = await usersResponse.json()

                if (requestsData.error) throw new Error(requestsData.error)
                if (usersData.error) throw new Error(usersData.error)

                // Ensure we have arrays
                const requestsArray = Array.isArray(requestsData) ? requestsData : []
                const usersArray = Array.isArray(usersData) ? usersData : [] // Combine request data with employee and user details
                const requestsWithEmployees = requestsArray.map(request => {
                    const user = usersArray.find(user => user.employeeId === request.employeeId)
                    const userType = user ? (user.role === "Admin" ? "Admin User" : "Normal User") : "Unknown User"
                    return {
                        ...request,
                        employeeEmail: user ? `${user.email} (${userType})` : "Unknown Employee",
                    }
                })

                setRequests(requestsWithEmployees)
                setError(null)
            } catch (err) {
                console.error("Error fetching data: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [fakeFetch])

    function handleStatus(status) {
        const statusStyles = {
            Approved: "bg-green-400",
            Denied: "bg-red-400",
            Pending: "bg-yellow-400",
        }

        return (
            <span className={`px-3 py-1 rounded-full text-md font-medium text-white ${statusStyles[status]}`}>
                {status}
            </span>
        )
    }

    const handleAdd = () => {
        setEditingRequest(null)
        setShowForm(true)
    }

    const handleEdit = request => {
        setEditingRequest(request)
        setShowForm(true)
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
                    <h1 className="text-2xl font-bold capitalize text-foreground">REQUESTS</h1>
                    <ButtonWithIcon
                        icon={IoAddSharp}
                        text="Request"
                        tooltipContent="Add New Request"
                        onClick={handleAdd}
                        variant="primary"
                    />
                </div>
                <hr className="mb-4" />
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Request Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Employee ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Requested Items
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
                        {requests && requests.length > 0 ? (
                            requests.map(request => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md">
                                            {request.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {request.employeeEmail}
                                    </td>
                                    <td className="px-6 py-4 text-start text-foreground">
                                        <div className="flex flex-col space-y-1">
                                            {request.requestItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md"
                                                >
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                        Qty: {item.quantity}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {handleStatus(request.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        <ButtonWithIcon
                                            icon={CiEdit}
                                            text="Edit"
                                            tooltipContent="Edit Request"
                                            onClick={() => handleEdit(request)}
                                            variant="primary"
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-destructive">
                                    No requests found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <RequestAddForm
                    onSubmit={data => {
                        // Handle form submission
                        setShowForm(false)
                        setEditingRequest(null)
                    }}
                    onCancel={() => {
                        setShowForm(false)
                        setEditingRequest(null)
                    }}
                    initialData={editingRequest}
                />
            )}
        </>
    )
}

export default Requests
