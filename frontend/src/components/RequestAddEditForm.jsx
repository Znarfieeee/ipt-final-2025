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
    const [formData, setFormData] = useState(() => {
        let initialItems = []

        // If we have initial data, prioritize the items
        if (initialData) {
            console.log("Initializing form with existing request:", initialData.id)

            // Check which property has items and use it
            if (initialData.requestItems && initialData.requestItems.length > 0) {
                console.log(`Using ${initialData.requestItems.length} items from requestItems`)
                // Deep copy to avoid reference issues
                initialItems = JSON.parse(JSON.stringify(initialData.requestItems))
                // Ensure each item has an id property if not already present
                initialItems = initialItems.map(item => ({
                    ...item,
                    id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                }))
            } else if (initialData.RequestItems && initialData.RequestItems.length > 0) {
                console.log(`Using ${initialData.RequestItems.length} items from RequestItems`)
                // Deep copy to avoid reference issues
                initialItems = JSON.parse(JSON.stringify(initialData.RequestItems))
                // Ensure each item has an id property if not already present
                initialItems = initialItems.map(item => ({
                    ...item,
                    id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                }))
            }
        }

        // If no items were found or this is a new request, add an empty item
        if (initialItems.length === 0) {
            initialItems = [
                {
                    name: "",
                    quantity: 1,
                    id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                },
            ]
        }

        // Return the complete form data object
        return {
            type: initialData?.type || "",
            userId: initialData?.userId || "",
            requestItems: initialItems,
            status: initialData?.status || "Pending",
            selectedEmployeeId:
                initialData?.selectedEmployeeId || initialData?.employeeId || initialData?.EmployeeId || "",
        }
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

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

        // Prevent double submission
        if (isSubmitting) {
            console.log("Submission already in progress, ignoring")
            return
        }

        setIsSubmitting(true)

        try {
            // Validate form data
            if (!formData.type || !formData.userId) {
                throw new Error("Please select a request type and employee")
            }

            // Enhanced validation for items
            if (!formData.requestItems || formData.requestItems.length === 0) {
                throw new Error("Request must have at least one item")
            }

            // Check for empty fields in items
            const emptyNameItems = formData.requestItems.filter(item => !item.name.trim())
            if (emptyNameItems.length > 0) {
                throw new Error(`Please provide names for all items (${emptyNameItems.length} empty names found)`)
            }

            // Check for invalid quantities
            const invalidQuantityItems = formData.requestItems.filter(item => !item.quantity || item.quantity < 1)
            if (invalidQuantityItems.length > 0) {
                throw new Error(
                    `Please provide valid quantities greater than zero for all items (${invalidQuantityItems.length} invalid quantities found)`
                )
            }

            const validItems = formData.requestItems.filter(item => item.name && item.quantity > 0)
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item with a name and quantity")
            }

            // Find the selected employee - ENHANCED EMPLOYEE LOOKUP
            let selectedEmployee
            let errorDetails = ""

            // FIRST: Try by stored employee ID (most reliable)
            if (formData.selectedEmployeeId) {
                selectedEmployee = employees.find(emp => emp.id === parseInt(formData.selectedEmployeeId))
                console.log(
                    "Using stored employee ID:",
                    formData.selectedEmployeeId,
                    selectedEmployee ? "found" : "not found"
                )
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee by stored ID. "
                }
            }

            // SECOND: Try by userId
            if (!selectedEmployee && formData.userId) {
                selectedEmployee = employees.find(emp => emp.userId.toString() === formData.userId.toString())
                console.log("Finding employee by userId:", formData.userId, selectedEmployee ? "found" : "not found")
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee by user ID. "
                }
            }

            // THIRD: Try initialData if provided
            if (!selectedEmployee && initialData && (initialData.employeeId || initialData.EmployeeId)) {
                const employeeId = initialData.employeeId || initialData.EmployeeId
                selectedEmployee = employees.find(emp => emp.id === parseInt(employeeId))
                console.log("Finding employee from initialData:", employeeId, selectedEmployee ? "found" : "not found")
                if (!selectedEmployee) {
                    errorDetails += "Could not find employee from initial data. "
                }
            }

            if (!selectedEmployee) {
                throw new Error(`Selected employee not found. ${errorDetails}Please try selecting the employee again.`)
            }

            console.log("Selected employee:", selectedEmployee)

            // Get complete user data for the employee
            let userData = null
            try {
                // Get the latest user data to ensure we have complete information
                const usersResponse = await backendConnection.getUsers()
                const users = Array.isArray(usersResponse) ? usersResponse : []
                userData = users.find(u => u.id === selectedEmployee.userId)
                console.log("Found user data for employee:", userData)
            } catch (err) {
                console.error("Error fetching user data:", err)
            }

            // IMPORTANT: Preserve original request items when updating
            let requestItems = validItems.map(item => ({
                name: item.name,
                quantity: parseInt(item.quantity),
                // For new items (with temp IDs), don't include an ID so the backend will create one
                // For existing items, ensure ID is properly parsed as a number
                ...(item.id && !item.id.toString().startsWith("temp-") ? { id: parseInt(item.id) } : {}),
            }))

            // For debugging purposes, log the items we found in the form
            console.log(
                `Processing ${requestItems.length} items from form:`,
                requestItems
                    .map(item => `${item.name} (${item.quantity}${item.id ? ` [ID:${item.id}]` : " [NEW]"}`)
                    .join(", ")
            )

            // When editing, ensure we include any existing request items that might not be in the form
            if (initialData && initialData.id) {
                // Add request ID to each item to ensure proper association
                requestItems = requestItems.map(item => ({
                    ...item,
                    requestId: initialData.id,
                    // Force item.id to be a number if it exists and isn't a temporary ID
                    ...(item.id && !item.id.toString().startsWith("temp-") ? { id: parseInt(item.id) } : {}),
                }))

                console.log("Final request items for edit:", requestItems)
            }

            // Prepare request data with COMPREHENSIVE employee information
            const requestData = {
                type: formData.type,
                // Use BOTH formats to ensure compatibility with backend
                EmployeeId: selectedEmployee.id, // This capitalization is critical - matches database field
                employeeId: selectedEmployee.id, // Lowercase version for consistency
                userId: formData.userId,
                employeeEmail: selectedEmployee.userEmail || "Selected Employee",
                // Include complete employee data directly for frontend display and backend reference
                Employee: {
                    id: selectedEmployee.id,
                    employeeId: selectedEmployee.employeeId,
                    position: selectedEmployee.position,
                    departmentId: selectedEmployee.departmentId,
                    userId: selectedEmployee.userId,
                    User: userData || {
                        id: parseInt(formData.userId),
                        email: selectedEmployee.userEmail,
                    },
                },
                status: formData.status,
                requestItems: requestItems,
                RequestItems: requestItems, // Add uppercase version to match backend expectations
            }

            console.log("Submitting request with comprehensive data:", requestData)

            let response
            let createdRequest

            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (initialData?.id) {
                    response = await backendConnection.updateRequest(initialData.id, requestData)
                } else {
                    response = await backendConnection.createRequest(requestData)
                }

                // Check for duplicate detection
                if (response && response.duplicateDetected) {
                    showToast(
                        "warning",
                        response.message ||
                            "A similar request was just created. Please wait a moment before trying again."
                    )
                    return // Exit but keep form open
                }

                // If we have a response with an ID, use it
                if (response && response.id) {
                    // Create a complete request object to return to parent
                    createdRequest = {
                        ...requestData,
                        id: response.id,
                        // Use backend response fields if available
                        Employee: response.Employee || requestData.Employee,
                        // CRITICAL: This ensures we have the correct items with real database IDs
                        // Make sure to convert any string IDs to numbers for proper backend matching
                        requestItems: (response.RequestItems || response.requestItems || requestData.requestItems).map(
                            item => ({
                                ...item,
                                // Ensure ID is a number if it exists
                                ...(item.id ? { id: parseInt(item.id) } : {}),
                            })
                        ),
                        // Also include uppercase version for consistency
                        RequestItems: (response.RequestItems || response.requestItems || requestData.requestItems).map(
                            item => ({
                                ...item,
                                // Ensure ID is a number if it exists
                                ...(item.id ? { id: parseInt(item.id) } : {}),
                            })
                        ),
                    }

                    // If we're editing and there are no items in the response, try to retrieve them separately
                    if (
                        initialData?.id &&
                        (!createdRequest.requestItems || createdRequest.requestItems.length === 0) &&
                        requestItems.length > 0
                    ) {
                        console.warn("No items in response but we have items locally - fetching detailed request")

                        try {
                            // Try getting the complete request to ensure we have the items
                            const detailedRequest = await backendConnection.getRequestById(initialData.id)
                            if (detailedRequest) {
                                const items = detailedRequest.requestItems || detailedRequest.RequestItems || []
                                if (items.length > 0) {
                                    console.log(`Retrieved ${items.length} items from detailed fetch`)
                                    createdRequest.requestItems = items.map(item => ({
                                        ...item,
                                        ...(item.id ? { id: parseInt(item.id) } : {}),
                                    }))
                                    createdRequest.RequestItems = [...createdRequest.requestItems]
                                } else {
                                    // If still no items from backend, use our local items as fallback
                                    console.warn("No items found in detailed request, using local items")
                                    createdRequest.requestItems = requestItems
                                    createdRequest.RequestItems = requestItems
                                }
                            }
                        } catch (err) {
                            console.error("Error fetching detailed request:", err)
                            // Use local items as fallback
                            createdRequest.requestItems = requestItems
                            createdRequest.RequestItems = requestItems
                        }
                    }

                    // Log the items in the created request to assist with debugging
                    console.log(
                        "Items in final request:",
                        (createdRequest.requestItems || [])
                            .map(item => `${item.name} (${item.quantity}${item.id ? ` [ID:${item.id}]` : ""})`)
                            .join(", ")
                    )

                    // Format employee email with role info if available
                    if (response.Employee && response.Employee.User) {
                        const user = response.Employee.User
                        const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                        createdRequest.employeeEmail = `${user.email} (${userType})`
                    }

                    // VERIFICATION: Double-check the response has proper employee info
                    if (!response.Employee || !response.Employee.User) {
                        console.warn("Response missing employee data - attempting repair")
                        try {
                            const repairedResponse = await backendConnection.repairRequest(response.id, {
                                employeeId: selectedEmployee.id,
                                userId: selectedEmployee.userId,
                            })

                            // Update with repaired data if available
                            if (repairedResponse && repairedResponse.Employee) {
                                createdRequest.Employee = repairedResponse.Employee
                                if (repairedResponse.Employee.User) {
                                    const user = repairedResponse.Employee.User
                                    const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                                    createdRequest.employeeEmail = `${user.email} (${userType})`
                                }
                            }
                        } catch (err) {
                            console.error("Repair attempt failed:", err)
                        }
                    }
                } else {
                    // No valid response, use the prepared request data
                    createdRequest = requestData
                }
            } else {
                // Use fake backend
                const method = initialData ? "PUT" : "POST"
                const url = initialData ? `/requests/${initialData.id}` : "/requests"

                const fetchResponse = await fakeFetch(url, {
                    method,
                    body: JSON.stringify(requestData),
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                response = await fetchResponse.json()
                if (response.error) {
                    throw new Error(response.error)
                }

                // For fake backend, use the returned ID
                createdRequest = {
                    ...requestData,
                    id: response.id || Date.now(),
                }
            }

            // Pass the complete request data back to the parent component
            console.log("Returning complete request to parent:", createdRequest)

            // Add a debug check to verify items are properly returned
            if (createdRequest.requestItems && createdRequest.requestItems.length > 0) {
                console.log(
                    `Successfully returning ${createdRequest.requestItems.length} items to parent:`,
                    createdRequest.requestItems.map(item => `${item.name} (${item.quantity})`).join(", ")
                )
            } else {
                console.warn("WARNING: No items in the request being returned to parent!")

                // If there are no items in createdRequest but there were items in the form,
                // manually add them to ensure they're returned to the parent
                if (requestItems && requestItems.length > 0) {
                    console.log("Re-adding items from form data to ensure they're returned")
                    createdRequest.requestItems = [...requestItems]
                    createdRequest.RequestItems = [...requestItems]
                }
            }

            onSubmit?.(createdRequest)
            showToast("success", initialData ? "Request updated successfully!" : "Request added successfully!")
        } catch (error) {
            console.error("Error submitting request:", error)
            showToast("error", error.message || "An error occurred while submitting the request")
        } finally {
            setIsSubmitting(false)
        }
    }

    const submitButton = (
        <button
            type="submit"
            className="px-4 py-2 rounded-md bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
        >
            {isSubmitting ? (
                <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Processing...
                </span>
            ) : (
                `${initialData ? "Update" : "Create"} Request`
            )}
        </button>
    )

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
                                    onValueChange={value => {
                                        console.log("Selected employee value:", value)
                                        // The value should be the user's ID
                                        handleChange({ target: { name: "userId", value } })

                                        // Find the selected employee for additional info
                                        const employee = employees.find(emp => emp.userId.toString() === value)
                                        if (employee) {
                                            console.log("Found employee:", employee)
                                            // Store the employee ID for later retrieval
                                            handleChange({
                                                target: {
                                                    name: "selectedEmployeeId",
                                                    value: employee.id,
                                                },
                                            })
                                        }
                                    }}
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
                                                // Create a new item with a unique temporary ID
                                                const newItem = {
                                                    name: "",
                                                    quantity: 1,
                                                    id: `temp-${Date.now()}-${Math.random()
                                                        .toString(36)
                                                        .substring(2, 9)}`,
                                                }
                                                // Use a deep copy to avoid reference issues
                                                const updatedItems = JSON.parse(
                                                    JSON.stringify(formData.requestItems || [])
                                                )
                                                updatedItems.push(newItem)

                                                setFormData(prev => ({
                                                    ...prev,
                                                    requestItems: updatedItems,
                                                }))
                                                console.log(`Added new item, now have ${updatedItems.length} items`)
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
                                                            // Create a deep copy of the items array
                                                            const newItems = JSON.parse(
                                                                JSON.stringify(formData.requestItems)
                                                            )
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
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            // Create a deep copy of the items array
                                                            const newItems = JSON.parse(
                                                                JSON.stringify(formData.requestItems)
                                                            )
                                                            // Ensure the quantity is converted to a number and is never less than 1
                                                            const value = parseInt(e.target.value)
                                                            newItems[index].quantity =
                                                                isNaN(value) || value < 1 ? 1 : value
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
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Create a deep copy of the items array
                                                            const newItems = JSON.parse(
                                                                JSON.stringify(formData.requestItems)
                                                            )
                                                            newItems.splice(index, 1)
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                            console.log(
                                                                `Removed item, now have ${newItems.length} items`
                                                            )
                                                        }}
                                                        className="flex gap-px items-center text-md hover:text-red-400 cursor-pointer"
                                                    >
                                                        <IoRemove /> Remove Item
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        <div id="modalButtons" className="flex justify-between">
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-md bg-red-400 text-secondary-foreground hover:bg-red-600 hover:text-background transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="mt-6">{submitButton}</div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default RequestAddEditForm
