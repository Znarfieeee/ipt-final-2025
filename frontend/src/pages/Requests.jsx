import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import { showToast } from "../util/alertHelper"
import "../index.css"

// Components
import RequestAddForm from "../components/RequestAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"
import { DeleteConfirmation } from "../components/ui/delete-confirmation"

// UI Libraries
import { IoAddSharp } from "react-icons/io5"
import { CiEdit } from "react-icons/ci"
import { FaTools, FaTrash } from "react-icons/fa"
import { RiDeleteBin6Line } from "react-icons/ri"

function Requests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingRequest, setEditingRequest] = useState(null)
    const { fakeFetch } = useFakeBackend()
    const [employeeMap, setEmployeeMap] = useState({})
    const [usersData, setUsersData] = useState([])

    // Add this new function to explicitly repair employee data in all requests
    const repairRequestEmployeeData = async (requestsData, employeesData, usersData) => {
        // Map users to employees for faster lookup
        const employeeMap = {}
        employeesData.forEach(employee => {
            const user = usersData.find(u => u.id === employee.userId)
            if (user) {
                employeeMap[employee.id] = {
                    ...employee,
                    userEmail: user.email,
                    userRole: user.role,
                    User: user, // Store the full user object
                }
            }
        })

        // Count how many repairs we make
        let repairedCount = 0

        // Repair each request's employee data
        const repairedRequests = requestsData.map(request => {
            const employeeId = request.employeeId || request.EmployeeId
            if (!employeeId) {
                return request
            }

            // Check if the request needs repair
            const needsRepair = !request.Employee || !request.Employee.User
            if (needsRepair && employeeMap[employeeId]) {
                repairedCount++

                // Create a deep copy of the request
                const repairedRequest = {
                    ...request,
                    Employee: employeeMap[employeeId],
                    employeeEmail: employeeMap[employeeId].userEmail,
                    employeeFound: true,
                }

                return repairedRequest
            }

            return request
        })

        return repairedRequests
    }

    // Add a function to repair all Unknown Employee issues at once
    const repairAllUnknownEmployees = async () => {
        try {
            // Find requests with Unknown Employee
            const unknownRequests = requests.filter(
                req => req.employeeEmail === "Unknown Employee" && (req.employeeId || req.EmployeeId)
            )

            if (unknownRequests.length === 0) {
                return
            }

            // Get the latest employee and user data
            const [employeesResponse, usersResponse] = await Promise.all([
                backendConnection.getEmployees(),
                backendConnection.getUsers(),
            ])

            const employees = Array.isArray(employeesResponse) ? employeesResponse : []
            const users = Array.isArray(usersResponse) ? usersResponse : []

            // Build a map for faster lookups
            const employeeMap = {}
            employees.forEach(employee => {
                employeeMap[employee.id] = employee
            })

            const userMap = {}
            users.forEach(user => {
                userMap[user.id] = user
            })

            // Track successful repairs
            let successCount = 0

            // Process each unknown request
            for (const request of unknownRequests) {
                try {
                    const employeeId = request.employeeId || request.EmployeeId
                    const employee = employeeMap[employeeId]

                    if (!employee) {
                        continue
                    }

                    const user = userMap[employee.userId]
                    if (!user) {
                        continue
                    }

                    // Prepare repair data
                    const repairData = {
                        id: employee.id,
                        employeeId: employee.id,
                        userId: employee.userId,
                        employeeEmail: user.email,
                    }

                    // Call repair endpoint
                    await backendConnection.repairRequest(request.id, repairData)
                    successCount++
                } catch (error) {
                    console.error(`Failed to repair request ${request.id}:`, error)
                }
            }

            if (successCount > 0) {
                showToast("success", `Fixed ${successCount} Unknown Employee issues`)

                // Refresh the data to show the updates
                refreshData()
            } else if (unknownRequests.length > 0) {
                showToast("error", "Could not fix any Unknown Employee issues")
            }
        } catch (error) {
            console.error("Error in bulk repair:", error)
            showToast("error", `Bulk repair failed: ${error.message}`)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                let requestsData = []

                if (!USE_FAKE_BACKEND) {
                    // Use real backend
                    const [requestsResponse, employeesResponse, usersResponse] = await Promise.all([
                        backendConnection.getRequests(),
                        backendConnection.getEmployees(),
                        backendConnection.getUsers(),
                    ])

                    // CRITICAL FIX: Deduplicate requests by ID
                    requestsData = Array.isArray(requestsResponse) ? requestsResponse : []

                    // Use a Map to deduplicate by ID
                    const uniqueRequestsMap = new Map()
                    requestsData.forEach(request => {
                        if (request.id) {
                            uniqueRequestsMap.set(request.id, request)
                        }
                    })

                    // Convert back to array
                    requestsData = Array.from(uniqueRequestsMap.values())

                    // CRITICAL: Fetch items for any requests that don't have them
                    for (const request of requestsData) {
                        const hasItems = request.requestItems?.length > 0 || request.RequestItems?.length > 0
                        if (!hasItems && request.id) {
                            try {
                                const items = await backendConnection.getRequestItems(request.id)
                                if (items && items.length > 0) {
                                    request.requestItems = items
                                    request.RequestItems = items
                                }
                            } catch (err) {
                                console.error(`Failed to fetch items for request ${request.id}:`, err)
                            }
                        }
                    }

                    const employeesData = Array.isArray(employeesResponse) ? employeesResponse : []
                    const usersData = Array.isArray(usersResponse) ? usersResponse : []

                    // Store these for later use in repairs/edits
                    setEmployeeMap(prevMap => {
                        const newMap = {}
                        employeesData.forEach(employee => {
                            const user = usersData.find(u => u.id === employee.userId)
                            if (user) {
                                newMap[employee.id] = {
                                    ...employee,
                                    userEmail: user.email,
                                    userRole: user.role,
                                    User: user,
                                }
                            }
                        })
                        return newMap
                    })
                    setUsersData(usersData)

                    // Apply repair to fix any missing relationships
                    const repairedRequests = await repairRequestEmployeeData(requestsData, employeesData, usersData)
                    requestsData = repairedRequests

                    // Process the requests with employee info
                    const requestsWithUsers = requestsData.map(request => {
                        let employeeEmail = "Unknown Employee"
                        let employeeFound = false
                        let sourceMethod = "none"

                        // First try using nested Employee.User data from the API (most reliable)
                        if (request.Employee && request.Employee.User) {
                            const user = request.Employee.User
                            employeeEmail = user.email
                            if (user.role) {
                                const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                                employeeEmail = `${employeeEmail}${userType ? ` (${userType})` : ""}`
                            }
                            employeeFound = true
                            sourceMethod = "nested data"
                        }
                        // Second, check both employeeId variations directly
                        else if (
                            (request.employeeId || request.EmployeeId) &&
                            employeeMap[request.employeeId || request.EmployeeId]
                        ) {
                            const employee = employeeMap[request.employeeId || request.EmployeeId]
                            const userType = employee.userRole === "Admin" ? "Admin User" : "Normal User"
                            employeeEmail = `${employee.userEmail}${userType ? ` (${userType})` : ""}`
                            employeeFound = true
                            sourceMethod = "employee map"
                        }
                        // Try using stored email directly as last resort
                        else if (request.employeeEmail) {
                            employeeEmail = request.employeeEmail
                            employeeFound = true
                            sourceMethod = "direct email"
                        }

                        // Fix request items to handle different casing
                        let requestItems = []

                        // Collect items from all possible sources
                        if (request.requestItems && request.requestItems.length > 0) {
                            requestItems = [...request.requestItems]
                        } else if (request.RequestItems && request.RequestItems.length > 0) {
                            requestItems = [...request.RequestItems]
                        } else {
                            // Try fetching individual request if items are missing
                            if (request.id) {
                                // Use the direct items endpoint for reliability
                                backendConnection
                                    .getRequestItems(request.id)
                                    .then(items => {
                                        if (items && items.length > 0) {
                                            // Update this specific request in the state
                                            setRequests(prevRequests =>
                                                prevRequests.map(req =>
                                                    req.id === request.id
                                                        ? {
                                                              ...req,
                                                              requestItems: items,
                                                              RequestItems: items,
                                                          }
                                                        : req
                                                )
                                            )
                                        }
                                    })
                                    .catch(err => {
                                        console.error(`Error fetching items for request ${request.id}:`, err)
                                    })
                            }
                        }

                        return {
                            ...request,
                            employeeEmail,
                            employeeFound,
                            requestItems,
                            RequestItems: requestItems, // Ensure both formats are available
                        }
                    })

                    setRequests(requestsWithUsers)

                    // Auto-repair all Unknown Employee issues
                    const hasUnknownEmployees = requestsWithUsers.some(req => req.employeeEmail === "Unknown Employee")
                    if (hasUnknownEmployees) {
                        setTimeout(() => repairAllUnknownEmployees(), 1000) // Slight delay to ensure UI is ready
                    }
                } else {
                    // Use fake backend
                    const [requestsResponse, employeesResponse, usersResponse] = await Promise.all([
                        fakeFetch("/requests"),
                        fakeFetch("/employees"),
                        fakeFetch("/accounts"),
                    ])

                    const [requests, employees, users] = await Promise.all([
                        requestsResponse.json(),
                        employeesResponse.json(),
                        usersResponse.json(),
                    ])

                    // Create a lookup map for faster employee finding
                    const employeeMap = {}
                    employees.forEach(emp => {
                        const user = users.find(u => u.id === emp.userId)
                        if (user) {
                            employeeMap[emp.id] = {
                                ...emp,
                                userEmail: user.email,
                                userRole: user.role,
                            }
                        }
                    })

                    const requestsWithUsers = requests.map(request => {
                        // First, try to find the employee using the EmployeeId field (capitalized as in DB)
                        let employeeId = request.EmployeeId

                        // If not found, try alternate field names
                        if (!employeeId) {
                            employeeId = request.employeeId
                        }

                        // Check different ways the employee data might be available
                        let employeeEmail = "Unknown Employee"
                        let userId = ""
                        let employeeFound = false

                        // Try from direct employeeEmail field
                        if (request.employeeEmail) {
                            employeeEmail = request.employeeEmail
                            employeeFound = true
                        }
                        // Try from employeeMap using numeric ID
                        else if (employeeId && employeeMap[employeeId]) {
                            const employee = employeeMap[employeeId]
                            const userType = employee.userRole === "Admin" ? "Admin User" : "Normal User"
                            employeeEmail = `${employee.userEmail} (${userType})`
                            userId = employee.userId
                            employeeFound = true
                        } else {
                            console.log(`Could not find employee for fake request ${request.id || "new"}`)
                        }

                        return {
                            ...request,
                            userId,
                            employeeEmail,
                            employeeFound,
                            requestItems: request.RequestItems || request.requestItems || [],
                        }
                    })
                    setRequests(requestsWithUsers)
                }
                setError(null)
            } catch (err) {
                console.error("Error fetching data: ", err)
                setError(err.message)
                showToast("error", "Failed to load requests")
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Export fetchData so it can be called from other functions in this component
        return () => {}
    }, [fakeFetch])

    // Add this function to allow other methods to trigger a refresh of the data
    const refreshData = async () => {
        try {
            setLoading(true)

            // Force a direct API call to get all requests with their items
            const requestsResponse = await backendConnection.getRequests()
            let requestsData = Array.isArray(requestsResponse) ? requestsResponse : []

            // Fetch employee and user data for proper display
            const [employeesResponse, usersResponse] = await Promise.all([
                backendConnection.getEmployees(),
                backendConnection.getUsers(),
            ])
            const employeesData = Array.isArray(employeesResponse) ? employeesResponse : []
            const usersData = Array.isArray(usersResponse) ? usersResponse : []

            // CRITICAL FIX: Force item fetch for ALL requests to ensure they're available
            const enhancedRequests = []
            for (const request of requestsData) {
                if (!request.id) continue

                // Check if items are already included in the request
                const hasItems = request.requestItems?.length > 0 || request.RequestItems?.length > 0

                let requestWithItems = { ...request }

                if (!hasItems) {
                    try {
                        // Force fetch items directly from the items endpoint
                        const items = await backendConnection.getRequestItems(request.id)
                        if (items && items.length > 0) {
                            requestWithItems.requestItems = items
                            requestWithItems.RequestItems = items
                        } else {
                            // Initialize empty arrays to prevent null/undefined errors
                            requestWithItems.requestItems = []
                            requestWithItems.RequestItems = []
                        }
                    } catch (error) {
                        console.error(`Error fetching items for request ${request.id}:`, error)
                        // Initialize empty arrays to prevent null/undefined errors
                        requestWithItems.requestItems = []
                        requestWithItems.RequestItems = []
                    }
                } else {
                    // Ensure both formats exist for consistency
                    if (request.requestItems && request.requestItems.length > 0) {
                        if (!request.RequestItems || request.RequestItems.length === 0) {
                            requestWithItems.RequestItems = [...request.requestItems]
                        }
                    } else if (request.RequestItems && request.RequestItems.length > 0) {
                        if (!request.requestItems || request.requestItems.length === 0) {
                            requestWithItems.requestItems = [...request.RequestItems]
                        }
                    }
                }

                // Find employee information
                let employeeEmail = "Unknown Employee"
                let employeeFound = false

                // Try to find employee data from various sources
                if (request.Employee && request.Employee.User) {
                    const user = request.Employee.User
                    employeeEmail = user.email
                    if (user.role) {
                        const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                        employeeEmail = `${employeeEmail} (${userType})`
                    }
                    employeeFound = true
                } else if (request.employeeId || request.EmployeeId) {
                    const employeeId = request.employeeId || request.EmployeeId
                    const employee = employeesData.find(emp => emp.id === employeeId)

                    if (employee) {
                        const user = usersData.find(u => u.id === employee.userId)
                        if (user) {
                            const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                            employeeEmail = `${user.email} (${userType})`
                            employeeFound = true
                        }
                    }
                }

                enhancedRequests.push({
                    ...requestWithItems,
                    employeeEmail,
                    employeeFound,
                })
            }

            // Update the state with our enhanced requests
            setRequests(enhancedRequests)

            // Update employee map for later use
            const newEmployeeMap = {}
            employeesData.forEach(employee => {
                const user = usersData.find(u => u.id === employee.userId)
                if (user) {
                    newEmployeeMap[employee.id] = {
                        ...employee,
                        userEmail: user.email,
                        userRole: user.role,
                        User: user,
                    }
                }
            })
            setEmployeeMap(newEmployeeMap)
            setUsersData(usersData)

            setError(null)
        } catch (err) {
            console.error("Error refreshing data: ", err)
            setError(err.message)
            showToast("error", "Failed to refresh requests")
        } finally {
            setLoading(false)
        }
    }

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
        // Ensure we have the correct employee information
        let userId = ""
        let employeeId = request.employeeId || request.EmployeeId

        // Try to get the userId from various sources
        if (request.Employee && request.Employee.User) {
            userId = request.Employee.User.id
        } else if (request.userId) {
            userId = request.userId
        } else {
            // Try to find the employee in the employees array
            const [employeesResponse, usersResponse] = Promise.all([
                backendConnection.getEmployees(),
                backendConnection.getUsers(),
            ])
                .then(([employeesData, usersData]) => {
                    // Look for the employee by ID
                    const employee = employeesData.find(emp => emp.id === employeeId)
                    if (employee) {
                        userId = employee.userId
                    }
                })
                .catch(err => {
                    console.error("Error finding employee:", err)
                })
        }

        // IMPORTANT: Ensure we capture all request items in their original form
        // This is critical when editing and changing status from Pending to Approved
        let requestItems = []

        // Collect items from all possible fields to ensure nothing is missed
        if (request.requestItems && request.requestItems.length > 0) {
            // Use deep copy to avoid reference issues
            requestItems = JSON.parse(JSON.stringify(request.requestItems))
        } else if (request.RequestItems && request.RequestItems.length > 0) {
            // Use deep copy to avoid reference issues
            requestItems = JSON.parse(JSON.stringify(request.RequestItems))
        } else {
            // No items found - this is a potential issue for editing
            console.warn("No items found in the request to edit")
            showToast("warning", "This request has no items. You'll need to add at least one item.")
        }

        // Create a complete request object for editing with all necessary data
        const editRequest = {
            ...request,
            userId: userId,
            employeeId: employeeId,
            EmployeeId: employeeId,
            requestItems: requestItems, // Include items explicitly
            RequestItems: requestItems, // Include in both formats to ensure consistency
        }

        setEditingRequest(editRequest)
        setShowForm(true)
    }

    const handleFormSubmit = async formData => {
        try {
            // Prevent duplicate form submissions
            if (loading) {
                return
            }

            setLoading(true)

            // Get the specific request items from the response
            const requestItems = formData.RequestItems || formData.requestItems || []

            // Validate that we have at least one item
            if (!requestItems || requestItems.length === 0) {
                throw new Error("Cannot save a request with no items. Please add at least one item.")
            }

            // Check for invalid items
            const invalidItems = requestItems.filter(item => !item.name || !item.quantity || item.quantity < 1)
            if (invalidItems.length > 0) {
                throw new Error(
                    `Cannot save request with invalid items. Please fix ${invalidItems.length} invalid items.`
                )
            }

            // Create a complete request object to add to the state - this handles both edit and new cases
            const processedRequest = {
                ...formData,
                // Ensure all the required properties are present
                id: formData.id,
                employeeId: formData.employeeId || formData.EmployeeId,
                EmployeeId: formData.EmployeeId || formData.employeeId,
                // CRITICAL: Make sure we have the items in BOTH formats for consistency
                requestItems: requestItems,
                RequestItems: requestItems,
                Employee: formData.Employee || null,
                employeeEmail: formData.employeeEmail || "Unknown Employee",
            }

            // CRITICAL: Ensure all temporary IDs are removed from the request items
            // before updating the UI state to match what's in the database
            if (processedRequest.requestItems && processedRequest.requestItems.length > 0) {
                // Clean up item IDs to match database format
                processedRequest.requestItems = processedRequest.requestItems.map(item => {
                    // If it has a temporary ID, remove it since the backend will assign a real ID
                    if (item.id && typeof item.id === "string" && item.id.startsWith("temp-")) {
                        const { id, ...rest } = item // Remove the id property
                        return rest
                    }
                    return item
                })

                // Also update the RequestItems format for consistency
                processedRequest.RequestItems = [...processedRequest.requestItems]
            } else {
                console.warn("No items found in the form submission data")
                throw new Error("Cannot save a request with no items. Please add at least one item.")
            }

            // Add some additional user-friendly formatting if we have the data
            if (processedRequest.Employee && processedRequest.Employee.User) {
                const user = processedRequest.Employee.User
                const userType = user.role === "Admin" ? "Admin User" : "Normal User"
                processedRequest.employeeEmail = `${user.email} (${userType})`
            }

            // Immediately update the UI with the processed data
            if (editingRequest?.id) {
                // Update existing request in the list
                setRequests(prevRequests =>
                    prevRequests.map(req => (req.id === editingRequest.id ? processedRequest : req))
                )
            } else {
                // Add the new request to the beginning of the list
                setRequests(prevRequests => [processedRequest, ...prevRequests])
            }

            // Close the form and clear editing state
            setShowForm(false)
            setEditingRequest(null)

            showToast("success", editingRequest ? "Request updated successfully!" : "Request added successfully!")
        } catch (err) {
            console.error("Error processing form submission:", err)
            showToast("error", err.message || "An error occurred while processing the request")
            return false // Indicate failure
        } finally {
            setLoading(false)
        }

        return true // Indicate success
    }

    const handleFormCancel = () => {
        setShowForm(false)
        setEditingRequest(null)
    }

    // Add function to repair a specific request
    const handleRepairRequest = async request => {
        try {
            setLoading(true)

            // First try to find a valid employee for this request
            const [employeesResponse, usersResponse] = await Promise.all([
                backendConnection.getEmployees(),
                backendConnection.getUsers(),
            ])

            const employees = Array.isArray(employeesResponse) ? employeesResponse : []
            const users = Array.isArray(usersResponse) ? usersResponse : []

            // Get the employeeId from the request
            const employeeId = request.employeeId || request.EmployeeId
            if (!employeeId) {
                showToast("error", "Cannot repair: No employee ID associated with this request")
                return
            }

            // Find the employee
            const employee = employees.find(emp => emp.id === parseInt(employeeId))
            if (!employee) {
                showToast("error", `Cannot find employee with ID ${employeeId}`)
                return
            }

            // Find the user
            const user = users.find(u => u.id === employee.userId)
            if (!user) {
                showToast("error", `Cannot find user for employee ${employee.employeeId}`)
                return
            }

            // Create repair data
            const repairData = {
                id: employee.id,
                employeeId: employee.id,
                userId: employee.userId,
                employeeEmail: user.email,
            }

            // Call the repair endpoint
            const response = await backendConnection.repairRequest(request.id, repairData)

            // Update the local request in the state
            setRequests(prevRequests =>
                prevRequests.map(req => {
                    if (req.id === request.id) {
                        // Create the complete updated request with employee data
                        return {
                            ...response,
                            employeeEmail: user.email + (user.role === "Admin" ? " (Admin User)" : " (Normal User)"),
                            employeeFound: true,
                            requestItems: response.RequestItems || response.requestItems || [],
                        }
                    }
                    return req
                })
            )

            showToast("success", `Successfully repaired request #${request.id}`)
        } catch (error) {
            console.error("Error repairing request:", error)
            showToast("error", `Failed to repair request: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Add function to handle direct status updates
    const handleStatusChange = async (request, newStatus) => {
        try {
            setLoading(true)

            // Get the proper request items array, checking all possible formats
            const requestItems = request.requestItems || request.RequestItems || []

            // Make a deep copy to avoid reference issues
            const itemsCopy = JSON.parse(JSON.stringify(requestItems))

            // Create update data that preserves all original request data
            const updateData = {
                ...request,
                status: newStatus,
                // CRITICAL: Ensure items are properly included in the exact format expected
                requestItems: itemsCopy,
            }

            // Call backend to update
            const updatedRequest = await backendConnection.updateRequest(request.id, updateData)

            // Determine the items in the response
            const updatedItems = updatedRequest.requestItems || updatedRequest.RequestItems || []

            // Update local state
            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req.id === request.id
                        ? {
                              ...updatedRequest,
                              employeeEmail: request.employeeEmail, // Preserve the formatted email
                              requestItems: updatedItems.length > 0 ? updatedItems : itemsCopy, // Use response items or fall back to original
                          }
                        : req
                )
            )

            showToast("success", `Request ${request.id} ${newStatus.toLowerCase()}`)
        } catch (error) {
            console.error(`Error updating request status:`, error)
            showToast("error", `Failed to update status: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Add function to handle delete all requests
    const handleDeleteAllRequests = async () => {
        try {
            setLoading(true)

            const response = await backendConnection.deleteAllRequests()

            // Clear the requests array
            setRequests([])

            showToast("success", `Successfully deleted ${response.deletedCount || "all"} requests`)
        } catch (error) {
            console.error("Error deleting all requests:", error)
            showToast("error", `Failed to delete requests: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Add function to delete individual request
    const handleDeleteRequest = async request => {
        try {
            setLoading(true)

            await backendConnection.deleteRequest(request.id)

            // Remove the deleted request from state
            setRequests(prevRequests => prevRequests.filter(req => req.id !== request.id))

            showToast("success", `Request ${request.id} deleted successfully`)
        } catch (error) {
            console.error("Error deleting request:", error)
            showToast("error", `Failed to delete request: ${error.message}`)
        } finally {
            setLoading(false)
        }
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
                    <div className="flex gap-2">
                        {requests.some(req => req.employeeEmail === "Unknown Employee") && (
                            <button
                                onClick={repairAllUnknownEmployees}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-1"
                                title="Fix all Unknown Employee issues"
                            >
                                <FaTools className="text-sm" /> Repair All
                            </button>
                        )}
                        <ButtonWithIcon
                            icon={IoAddSharp}
                            text="Request"
                            tooltipContent="Add New Request"
                            onClick={handleAdd}
                            variant="primary"
                        />
                    </div>
                </div>
                <hr className="mb-4" />
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Request Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Employee
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
                                        {request.employeeEmail === "Unknown Employee" ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-medium">Unknown Employee</span>
                                                <button
                                                    onClick={() => handleRepairRequest(request)}
                                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700"
                                                    title="Repair employee association"
                                                >
                                                    <FaTools className="inline mr-1" /> Fix
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-green-700">{request.employeeEmail}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-start text-foreground">
                                        <div className="flex flex-col space-y-1">
                                            {request.requestItems && request.requestItems.length > 0 ? (
                                                request.requestItems.map((item, index) => (
                                                    <div
                                                        key={`item-${request.id}-${index}-${item.id || "new"}`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="font-medium">
                                                            {item.name || "Unknown Item"}
                                                        </span>
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            Qty: {item.quantity || 1}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : request.RequestItems && request.RequestItems.length > 0 ? (
                                                // Fallback to RequestItems if requestItems is empty
                                                request.RequestItems.map((item, index) => (
                                                    <div
                                                        key={`item-${request.id}-${index}-${item.id || "new"}`}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="font-medium">
                                                            {item.name || "Unknown Item"}
                                                        </span>
                                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            Qty: {item.quantity || 1}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500 italic">No items</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {handleStatus(request.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        <div className="flex gap-2">
                                            <ButtonWithIcon
                                                icon={CiEdit}
                                                text=""
                                                tooltipContent="Edit Request"
                                                onClick={() => handleEdit(request)}
                                                variant="primary"
                                            />
                                            <DeleteConfirmation
                                                onConfirm={() => handleDeleteRequest(request)}
                                                itemName={`request #${request.id}`}
                                                itemType="request"
                                            />
                                        </div>
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
                <RequestAddForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={editingRequest} />
            )}
        </>
    )
}

export default Requests
