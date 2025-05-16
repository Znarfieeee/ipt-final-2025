import React, { useState, useEffect } from "react"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import { useFakeBackend } from "../api/fakeBackend"
import { showToast } from "../util/alertHelper"

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ButtonWithIcon from "./ButtonWithIcon"
import { IoRemove } from "react-icons/io5"
import { IoAddSharp } from "react-icons/io5"

function RequestAddEditForm({ onSubmit, onCancel, initialData }) {
    const { fakeFetch } = useFakeBackend()
    const [employees, setEmployees] = useState([])
    const [formData, setFormData] = useState({
        type: initialData?.type || "",
        userId: initialData?.userId || "",
        requestItems: initialData?.requestItems || [
            {
                name: "",
                quantity: 1,
            },
        ],
        status: initialData?.status || "Pending",
    })

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                let employeesData = []

                if (!USE_FAKE_BACKEND) {
                    // Use real backend
                    const [employeesResponse, usersResponse] = await Promise.all([
                        backendConnection.getEmployees(),
                        backendConnection.getUsers(),
                    ])
                    employeesData = Array.isArray(employeesResponse) ? employeesResponse : []
                    const usersData = Array.isArray(usersResponse) ? usersResponse : []

                    // Combine employee data with user info
                    employeesData = employeesData.map(employee => {
                        const user = usersData.find(user => user.id === employee.userId)
                        return {
                            ...employee,
                            userEmail: user ? user.email : "Unknown",
                        }
                    })
                } else {
                    // Use fake backend
                    const response = await fakeFetch("/employees")
                    const data = await response.json()
                    employeesData = Array.isArray(data) ? data : []
                }

                setEmployees(employeesData)
            } catch (error) {
                console.error("Error fetching employees:", error)
                showToast("error", "Failed to fetch employees")
                setEmployees([])
            }
        }
        fetchEmployees()
    }, [fakeFetch])

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            // Validate form data
            if (!formData.type || !formData.userId) {
                throw new Error("Please select a request type and employee")
            }

            const validItems = formData.requestItems.filter(item => item.name && item.quantity > 0)
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item with a name and quantity")
            }

            // Prepare request data with valid items only
            const requestData = {
                type: formData.type,
                userId: formData.userId,
                requestItems: validItems.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity),
                })),
                status: formData.status,
            }

            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (initialData?.id) {
                    await backendConnection.updateRequest(initialData.id, requestData)
                } else {
                    await backendConnection.createRequest(requestData)
                }
            } else {
                // Use fake backend
                const method = initialData ? "PUT" : "POST"
                const url = initialData ? `/requests/${initialData.id}` : "/requests"

                const response = await fakeFetch(url, {
                    method,
                    body: JSON.stringify(requestData),
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }
            }

            onSubmit?.(requestData)
        } catch (error) {
            console.error("Error submitting request:", error)
            showToast("error", error.message || "An error occurred while submitting the request")
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <header className="text-2xl font-bold text-foreground mb-6">
                            {initialData ? "Edit" : "Add"} Request
                        </header>
                        <div className="space-y-4">
                            <div className="item">
                                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                                    Type
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "type", value } })}
                                    value={formData.type}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select request type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Equipment">Equipment</SelectItem>
                                        <SelectItem value="Leave">Leave</SelectItem>
                                        <SelectItem value="Resources">Resources</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-1">
                                    Employee
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "userId", value } })}
                                    value={formData.userId}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.userId.toString()}>
                                                {employee.employeeId} - {employee.position} ({employee.userEmail})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                    Status
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "status", value } })}
                                    value={formData.status}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Denied">Denied</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div>
                                    <div className="flex gap-px justify-between items-center">
                                        <label
                                            htmlFor="type"
                                            className="block text-sm font-medium text-foreground mb-1"
                                        >
                                            Items
                                        </label>{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newItem = { name: "", quantity: 1 }
                                                setFormData(prev => ({
                                                    ...prev,
                                                    requestItems: Array.isArray(prev.requestItems)
                                                        ? [...prev.requestItems, newItem]
                                                        : [newItem],
                                                }))
                                            }}
                                            className="flex gap-px items-center text-md hover:text-blue-400 cursor-pointer"
                                        >
                                            <IoAddSharp /> Add Item
                                        </button>
                                    </div>
                                    {(Array.isArray(formData.requestItems) ? formData.requestItems : []).map(
                                        (item, index) => (
                                            <div key={index} className="border-1 flex gap-4 p-2 mb-2">
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`name-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`name-${index}`}
                                                        value={item.name}
                                                        onChange={e => {
                                                            const newItems = [...formData.requestItems]
                                                            newItems[index].name = e.target.value
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`quantity-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id={`quantity-${index}`}
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...formData.requestItems]
                                                            newItems[index].quantity = parseInt(e.target.value) || 1
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newItems = formData.requestItems.filter(
                                                                (_, i) => i !== index
                                                            )
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="flex gap-px justify-center items-center text-sm py-2 hover:text-red-400 cursor-pointer"
                                                    >
                                                        <IoRemove />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-md bg-red-400 text-secondary-foreground hover:bg-red-600 hover:text-background transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors"
                                >
                                    {initialData ? "Update" : "Create"} Request
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default RequestAddEditForm
