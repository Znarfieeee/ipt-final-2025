import { showToast } from "../util/alertHelper"

const BASE_URL = "http://localhost:3000/api"

class BackendConnection {
    // Authentication
    async login(email, password) {
        return this.fetchData("/auth/login", {
            method: "POST",
            body: { email, password },
        })
    }

    async logout() {
        // Call the logout endpoint
        await this.fetchData("/auth/logout", {
            method: "POST",
        })

        // Remove token from localStorage
        localStorage.removeItem("token")
    }

    // Users - Using auth endpoint for user management
    async getUsers() {
        // Try public endpoint first for development
        try {
            console.log(`Attempting to fetch users from public endpoint`)
            const data = await this.fetchData("/public/users")
            if (data && data.users) {
                console.log(`Successfully fetched users from public endpoint`)
                return data.users
            }
        } catch (error) {
            // Fall back to authorized endpoints
        }

        // Try authorized endpoints if public one fails
        const endpoints = ["/auth/users", "/auth/accounts", "/auth", "/test-users"]

        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting to fetch users from ${endpoint}`)
                const data = await this.fetchData(endpoint)
                if (data) {
                    console.log(`Successfully fetched users from ${endpoint}`)
                    return data
                }
            } catch (error) {
                // Continue to next endpoint if this one fails
                continue
            }
        }

        const fallbackUsers = [
            {
                id: 1,
                firstName: "Admin",
                lastName: "User",
                email: "admin@example.com",
                role: "Admin",
                status: "Active",
            },
        ]

        // Show toast but return fallback data
        showToast("warning", "Using offline user data. Some features may be limited.")
        return fallbackUsers
    }

    async getUserById(id) {
        return this.fetchData(`/auth/users/${id}`)
    }

    async createUser(userData) {
        try {
            const response = await this.fetchData("/auth/users", {
                method: "POST",
                body: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role,
                    status: userData.status,
                    title: userData.title,
                },
            })
            return response
        } catch (error) {
            throw error
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await this.fetchData(`/auth/users/${id}`, {
                method: "PUT",
                body: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    role: userData.role,
                    status: userData.status,
                    title: userData.title,
                },
            })
            return response
        } catch (error) {
            throw error
        }
    }

    // Employees
    async getEmployees() {
        return this.fetchData("/employees")
    }

    async getEmployeeById(id) {
        return this.fetchData(`/employees/${id}`)
    }

    async createEmployee(employeeData) {
        try {
            console.log("Sending employee data to backend:", employeeData)
            const response = await this.fetchData("/employees", {
                method: "POST",
                body: employeeData,
            })
            return response
        } catch (error) {
            // Extract validation errors if they exist
            if (error.response && error.response.errors) {
                const validationErrors = error.response.errors.map(err => `${err.field}: ${err.message}`).join(", ")
                throw new Error(`Validation failed: ${validationErrors}`)
            }
            throw error
        }
    }

    async updateEmployee(id, employeeData) {
        return this.fetchData(`/employees/${id}`, {
            method: "PUT",
            body: employeeData,
        })
    }

    // Departments
    async getDepartments() {
        return this.fetchData("/departments")
    }

    async getDepartmentById(id) {
        return this.fetchData(`/departments/${id}`)
    }

    async createDepartment(departmentData) {
        return this.fetchData("/departments", {
            method: "POST",
            body: departmentData,
        })
    }

    async updateDepartment(id, departmentData) {
        return this.fetchData(`/departments/${id}`, {
            method: "PUT",
            body: departmentData,
        })
    }

    // Workflows
    async getWorkflows() {
        return this.fetchData("/workflows")
    }

    async getWorkflowsByEmployeeId(employeeId) {
        return this.fetchData(`/workflows/employee/${employeeId}`)
    }

    async createWorkflow(workflowData) {
        return this.fetchData("/workflows", {
            method: "POST",
            body: workflowData,
        })
    }

    async updateWorkflow(id, workflowData) {
        return this.fetchData(`/workflows/${id}/status`, {
            method: "PUT",
            body: workflowData,
        })
    }

    // Requests
    async getRequests() {
        return this.fetchData("/requests")
    }

    // Get a specific request by ID - with retries to handle potential item fetch issues
    async getRequestById(id) {
        try {
            console.log(`Fetching detailed request by ID: ${id}`)

            // Try up to 3 times to get the request with its items
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const response = await fetch(`${this.apiUrl}/requests/${id}`, {
                        method: "GET",
                        headers: this.headers,
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`)
                    }

                    const data = await response.json()

                    // Check if we have request items
                    const hasItems =
                        (data.requestItems && data.requestItems.length > 0) ||
                        (data.RequestItems && data.RequestItems.length > 0)

                    console.log(`Request ${id} fetch attempt ${attempt}: Found ${hasItems ? "with" : "WITHOUT"} items`)

                    // If we have items, return the data
                    if (hasItems) {
                        return data
                    }

                    // If we're on the last attempt, return what we have even without items
                    if (attempt === 3) {
                        console.warn(`Failed to find items for request ${id} after ${attempt} attempts`)
                        return data
                    }

                    // Otherwise, wait briefly and try again
                    await new Promise(resolve => setTimeout(resolve, 500))
                    console.log(`Retrying request ${id} fetch, attempt ${attempt + 1}`)
                } catch (fetchError) {
                    if (attempt === 3) {
                        throw fetchError
                    }
                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, 500))
                    console.log(`Error in attempt ${attempt}, retrying: ${fetchError.message}`)
                }
            }

            throw new Error(`Failed to fetch request ${id} after multiple attempts`)
        } catch (error) {
            console.error("Error fetching request by ID:", error)
            throw error
        }
    }

    // Track in-progress requests to prevent duplicates
    _pendingRequests = new Set()

    async createRequest(requestData) {
        try {
            const requestKey = `create_${requestData.type}_${
                requestData.employeeId || requestData.EmployeeId
            }_${Date.now()}`

            // Check if this exact request is already being processed
            if (this._pendingRequests.has(requestKey)) {
                console.warn("Duplicate request submission detected, ignoring")
                return null
            }

            // Mark this request as in progress
            this._pendingRequests.add(requestKey)

            console.log("Creating request with data:", requestData)

            // Ensure we have the capitalized EmployeeId field
            const finalData = { ...requestData }
            if (finalData.employeeId && !finalData.EmployeeId) {
                finalData.EmployeeId = finalData.employeeId
            }

            try {
                const response = await this.fetchData("/requests", {
                    method: "POST",
                    body: finalData,
                })
                console.log("Create request response:", response)
                return response
            } catch (error) {
                // Special handling for duplicate request errors (409 status)
                if (error.status === 409 && error.response?.duplicateDetected) {
                    console.warn("Server detected duplicate request:", error.response.message)
                    // Return a special object to indicate a duplicate was detected
                    return {
                        duplicateDetected: true,
                        message: error.response.message,
                        success: false,
                    }
                }
                // Re-throw other errors
                throw error
            }
        } catch (error) {
            console.error("Error creating request:", error)
            throw error
        } finally {
            // Clear the pending request marker after a short delay
            // to prevent immediate re-submission
            const requestKey = `create_${requestData.type}_${
                requestData.employeeId || requestData.EmployeeId
            }_${Date.now()}`
            setTimeout(() => {
                this._pendingRequests.delete(requestKey)
            }, 2000)
        }
    }

    // Update a request
    async updateRequest(id, requestData) {
        try {
            console.log(`Updating request ${id} with data:`, {
                ...requestData,
                itemCount: (requestData.requestItems?.length || 0) + (requestData.RequestItems?.length || 0),
            })

            // Ensure we have both requestItems and RequestItems for backend compatibility
            if (requestData.requestItems && !requestData.RequestItems) {
                requestData.RequestItems = [...requestData.requestItems]
            } else if (requestData.RequestItems && !requestData.requestItems) {
                requestData.requestItems = [...requestData.RequestItems]
            }

            // Use BASE_URL instead of this.apiUrl which is undefined
            const response = await fetch(`${BASE_URL}/requests/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token")
                        ? {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                          }
                        : {}),
                },
                body: JSON.stringify(requestData),
            })

            if (!response.ok) {
                // Safely handle error response that might not be JSON
                try {
                    const text = await response.text()
                    if (text && text.trim()) {
                        try {
                            const errorData = JSON.parse(text)
                            throw new Error(errorData.message || `Failed to update request: ${response.status}`)
                        } catch (parseError) {
                            // If JSON parsing fails, use the text response
                            throw new Error(`Failed to update request: ${text || response.status}`)
                        }
                    } else {
                        throw new Error(`Failed to update request: ${response.status}`)
                    }
                } catch (textError) {
                    throw new Error(`Failed to update request: ${response.status}`)
                }
            }

            // Safely handle response that might not be JSON
            try {
                const text = await response.text()
                if (text && text.trim()) {
                    try {
                        const data = JSON.parse(text)

                        // Log what came back from the backend
                        console.log(`Update response for request ${id}:`, {
                            success: true,
                            hasItems: !!(data.requestItems?.length || data.RequestItems?.length),
                            itemCount: (data.requestItems?.length || 0) + (data.RequestItems?.length || 0),
                        })

                        return data
                    } catch (parseError) {
                        console.error("Error parsing response as JSON:", parseError)
                        // Return the original data if parsing fails
                        return {
                            ...requestData,
                            id: id,
                        }
                    }
                } else {
                    // Handle empty response
                    console.warn("Empty response from server, returning original request data")
                    return {
                        ...requestData,
                        id: id,
                    }
                }
            } catch (textError) {
                console.error("Error reading response text:", textError)
                // Return the original data if text extraction fails
                return {
                    ...requestData,
                    id: id,
                }
            }
        } catch (error) {
            console.error("Error updating request:", error)
            throw error
        }
    }

    // Add this new method for repairing requests with unknown employees
    async repairRequest(id, employeeData) {
        try {
            console.log("Repairing request with ID", id, "using employee data:", employeeData)

            // Prepare repair data with both employee ID formats
            const repairData = {
                employeeId: employeeData.id || employeeData.employeeId,
                EmployeeId: employeeData.id || employeeData.employeeId,
                userId: employeeData.userId,
            }

            // Call the repair endpoint
            const response = await this.fetchData(`/requests/${id}/repair`, {
                method: "POST",
                body: repairData,
            })

            console.log("Repair request response:", response)
            return response
        } catch (error) {
            console.error("Error repairing request:", error)
            throw error
        }
    }

    // Add method to deduplicate requests
    async deduplicateRequests() {
        try {
            const response = await this.fetchData("/requests/deduplicate", {
                method: "POST",
            })
            console.log("Deduplicate response:", response)
            return response
        } catch (error) {
            console.error("Error deduplicating requests:", error)
            throw error
        }
    }

    // Add method to delete all requests
    async deleteAllRequests() {
        try {
            const response = await this.fetchData("/requests/all", {
                method: "DELETE",
            })
            console.log("Delete all requests response:", response)
            return response
        } catch (error) {
            console.error("Error deleting all requests:", error)
            throw error
        }
    }

    // Helper method for making API requests
    async fetchData(endpoint, options = {}) {
        try {
            const url = `${BASE_URL}${endpoint}`
            const fetchOptions = {
                method: options.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                credentials: "include", // Include cookies for cross-origin requests
                mode: "cors", // Explicitly set CORS mode
            }

            // Add token if available
            const token = localStorage.getItem("token")
            if (token) {
                fetchOptions.headers.Authorization = `Bearer ${token}`
            }

            // Add body if provided
            if (options.body) {
                fetchOptions.body = JSON.stringify(options.body)
            }

            console.log(`Fetching ${url} with options:`, fetchOptions)
            const response = await fetch(url, fetchOptions)

            // Handle 401 Unauthorized by redirecting to login
            if (response.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "/login"
                return null
            }

            // Get the response content regardless of status
            let responseData = null
            const contentType = response.headers.get("Content-Type")
            if (contentType && contentType.includes("application/json")) {
                try {
                    responseData = await response.json()
                } catch (e) {
                    console.warn("Could not parse response as JSON:", e)
                }
            }

            // Check if response is OK
            if (!response.ok) {
                // Use any error message from the response
                let errorMessage = response.statusText
                if (responseData && (responseData.message || responseData.error)) {
                    errorMessage = responseData.message || responseData.error || response.statusText
                }

                const error = new Error(`HTTP error ${response.status}: ${errorMessage}`)
                error.status = response.status
                error.response = responseData // Attach the full response data

                throw error
            }

            return responseData
        } catch (error) {
            throw error
        }
    }

    async getAuthEmployees() {
        return this.fetchData("/auth/employees")
    }

    // Employee Transfers
    async transferEmployee(employeeId, departmentId) {
        return this.fetchData(`/employees/${employeeId}/transfer`, {
            method: "POST",
            body: { departmentId },
        })
    }
}

const backendConnection = new BackendConnection()
export default backendConnection
