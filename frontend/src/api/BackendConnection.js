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

    async getRequestById(id) {
        return this.fetchData(`/requests/${id}`)
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

    async updateRequest(id, requestData) {
        try {
            console.log("Updating request with ID", id, "and data:", requestData)

            // Ensure we have the capitalized EmployeeId field
            const finalData = { ...requestData }
            if (finalData.employeeId && !finalData.EmployeeId) {
                finalData.EmployeeId = finalData.employeeId
            }

            // CRITICAL: Ensure request items are properly included and formatted
            // This is vital when changing status from pending to approved
            if (requestData.requestItems || requestData.RequestItems) {
                // Create a deep copy to prevent reference issues
                const items = JSON.parse(JSON.stringify(requestData.requestItems || requestData.RequestItems))

                if (Array.isArray(items) && items.length > 0) {
                    // Use a standardized format to ensure proper handling by backend
                    finalData.requestItems = items.map(item => ({
                        name: item.name,
                        quantity: parseInt(item.quantity || 1),
                        requestId: id, // Ensure each item has the request ID
                        // Preserve existing item ID if available
                        id: item.id || undefined,
                    }))
                    console.log(`Prepared ${finalData.requestItems.length} items for update`)
                } else {
                    console.warn(`Request update for ID ${id} has no items!`)
                    // Ensure we at least have an empty array to avoid null reference issues
                    finalData.requestItems = []
                }
            } else {
                console.warn(`No items found in request data for ID ${id}`)
                finalData.requestItems = []
            }

            const response = await this.fetchData(`/requests/${id}`, {
                method: "PUT",
                body: finalData,
            })
            console.log("Update request response:", response)

            // Ensure the response has both versions of the request items
            if (response) {
                if (response.requestItems && !response.RequestItems) {
                    response.RequestItems = response.requestItems
                } else if (response.RequestItems && !response.requestItems) {
                    response.requestItems = response.RequestItems
                }
            }

            return response
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
