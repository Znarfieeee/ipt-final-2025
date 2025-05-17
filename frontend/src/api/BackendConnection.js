import { showToast } from "../util/alertHelper"

// Use window.location.hostname for dynamic backend URL determination
const BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://ipt-final-2025-backend-o7yl.onrender.com"

class BackendConnection {
    // Authentication
    async login(email, password) {
        const result = await this.fetchData("/api/auth/login", {
            method: "POST",
            body: { email, password },
        })

        if (result && result.token) {
            // Store token
            localStorage.setItem("token", result.token)

            // Store user info
            if (result.user) {
                localStorage.setItem("userInfo", JSON.stringify(result.user))
            }
            return result
        }
        return null
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
            const data = await this.fetchData("/public/users")
            if (data && data.users) {
                return data.users
            }
        } catch {
            // Fall back to authorized endpoints
        }

        // Try authorized endpoints if public one fails
        const endpoints = ["/auth/users", "/auth/accounts", "/auth", "/test-users"]

        for (const endpoint of endpoints) {
            try {
                const data = await this.fetchData(endpoint)
                if (data) {
                    return data
                }
            } catch {
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
        return this.fetchData("/auth/users", {
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
    }

    async updateUser(id, userData) {
        return this.fetchData(`/auth/users/${id}`, {
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
            // Try up to 3 times to get the request with its items
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // Use BASE_URL instead of this.apiUrl which is undefined
                    const response = await fetch(`${BASE_URL}/requests/${id}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            ...(localStorage.getItem("token")
                                ? {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                                  }
                                : {}),
                        },
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`)
                    }

                    const data = await response.json()

                    // Check if we have request items
                    const hasItems =
                        (data.requestItems && data.requestItems.length > 0) ||
                        (data.RequestItems && data.RequestItems.length > 0)

                    // If we have items, return the data
                    if (hasItems) {
                        // Ensure we have items in both formats for consistency
                        if (
                            data.requestItems &&
                            data.requestItems.length > 0 &&
                            (!data.RequestItems || data.RequestItems.length === 0)
                        ) {
                            data.RequestItems = [...data.requestItems]
                        } else if (
                            data.RequestItems &&
                            data.RequestItems.length > 0 &&
                            (!data.requestItems || data.requestItems.length === 0)
                        ) {
                            data.requestItems = [...data.RequestItems]
                        }
                        return data
                    }

                    // If we're on the last attempt, return what we have even without items
                    if (attempt === 3) {
                        return data
                    }

                    // Otherwise, wait briefly and try again
                    await new Promise(resolve => setTimeout(resolve, 500))
                } catch (fetchError) {
                    if (attempt === 3) {
                        throw fetchError
                    }
                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, 500))
                }
            }

            throw new Error(`Failed to fetch request ${id} after multiple attempts`)
        } catch (error) {
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
                return null
            }

            // Mark this request as in progress
            this._pendingRequests.add(requestKey)

            // IMPORTANT FIX: Clean & format request items before sending
            const cleanedData = this._cleanRequestItems(requestData)

            try {
                const response = await this.fetchData("/requests", {
                    method: "POST",
                    body: cleanedData,
                })
                return response
            } catch (error) {
                // Special handling for duplicate request errors (409 status)
                if (error.status === 409 && error.response?.duplicateDetected) {
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
            // Save the original request items for verification
            const originalItems = (requestData.requestItems || requestData.RequestItems || []).map(item => ({
                ...item,
                name: item.name,
                quantity: parseInt(item.quantity) || 1,
            }))

            // Prepare request items for backend - ensure they're properly formatted
            const requestItems = originalItems.map(item => ({
                name: item.name,
                quantity: parseInt(item.quantity) || 1,
                // Only include real database IDs, not temporary IDs
                ...(item.id && !String(item.id).startsWith("temp-") ? { id: parseInt(item.id) } : {}),
            }))

            // Create a clean copy of the request data with both formats of items
            const cleanedData = {
                ...requestData,
                requestItems: requestItems,
                RequestItems: requestItems,
            }

            // Use direct fetch for more reliable results
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
                body: JSON.stringify(cleanedData),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Update failed: ${response.status} ${errorText || ""}`)
            }

            // Parse the response
            let responseData
            try {
                responseData = await response.json()
            } catch {
                // If parse fails, create a basic response
                responseData = { id, ...cleanedData }
            }

            // Verify items are in response
            let finalItems = responseData.requestItems || responseData.RequestItems || []

            // If response is missing items but we had items originally, fetch them directly
            if (finalItems.length === 0 && originalItems.length > 0) {
                try {
                    // Get items directly from items endpoint
                    const fetchedItems = await this.getRequestItems(id)
                    if (fetchedItems && fetchedItems.length > 0) {
                        finalItems = fetchedItems

                        // Update response with fetched items
                        responseData.requestItems = finalItems
                        responseData.RequestItems = finalItems
                    } else {
                        // Fall back to original items if direct fetch returned nothing
                        responseData.requestItems = originalItems
                        responseData.RequestItems = originalItems
                    }
                } catch {
                    // Use original items as fallback
                    responseData.requestItems = originalItems
                    responseData.RequestItems = originalItems
                }
            }

            return responseData
        } catch (error) {
            throw error
        }
    }

    // FIXED: Add new helper method to properly clean and format request items
    _cleanRequestItems(requestData) {
        // Create a copy to avoid modifying the original
        const cleanedData = { ...requestData }

        // Ensure we have the capitalized EmployeeId field
        if (cleanedData.employeeId && !cleanedData.EmployeeId) {
            cleanedData.EmployeeId = cleanedData.employeeId
        }

        // Get items from either field name
        const items = cleanedData.requestItems || cleanedData.RequestItems || []

        if (items.length > 0) {
            // Format items properly - most importantly, remove temp IDs
            const formattedItems = items.map(item => {
                // Create a proper item object
                const formattedItem = {
                    name: item.name,
                    quantity: parseInt(item.quantity) || 1,
                }

                // Only include ID if it's a real database ID (not a temp ID)
                if (item.id && typeof item.id === "number") {
                    formattedItem.id = item.id
                }

                return formattedItem
            })

            // Set BOTH formats for maximum compatibility
            cleanedData.requestItems = formattedItems
            cleanedData.RequestItems = formattedItems
        }

        return cleanedData
    }

    // Add this new method for repairing requests with unknown employees
    async repairRequest(id, employeeData) {
        // Prepare repair data with both employee ID formats
        const repairData = {
            employeeId: employeeData.id || employeeData.employeeId,
            EmployeeId: employeeData.id || employeeData.employeeId,
            userId: employeeData.userId,
        }

        // Call the repair endpoint
        return this.fetchData(`/requests/${id}/repair`, {
            method: "POST",
            body: repairData,
        })
    }

    // Add method to deduplicate requests
    async deduplicateRequests() {
        return this.fetchData("/requests/deduplicate", {
            method: "POST",
        })
    }

    // Add method to delete all requests
    async deleteAllRequests() {
        return this.fetchData("/requests/all", {
            method: "DELETE",
        })
    }

    // Helper method for making API requests
    async fetchData(endpoint, options = {}) {
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

    // Get request items directly by request ID
    async getRequestItems(requestId) {
        try {
            // Try up to 5 times with increasing timeouts
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    // Use direct fetch for more reliable results
                    const response = await fetch(`${BASE_URL}/requests/${requestId}/items`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            ...(localStorage.getItem("token")
                                ? {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                                  }
                                : {}),
                        },
                        cache: "no-store", // Force fresh data without caching
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    const items = await response.json()

                    // Store items in localStorage as a backup
                    if (items && items.length > 0) {
                        try {
                            localStorage.setItem(`request_${requestId}_items`, JSON.stringify(items))
                        } catch {
                            // Silently fail if localStorage fails
                        }
                        return items
                    }

                    // If we get an empty array and this isn't the last attempt, wait and try again
                    if (attempt < 5) {
                        await new Promise(resolve => setTimeout(resolve, 300 * attempt))
                    }
                } catch (error) {
                    if (attempt < 5) {
                        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
                    } else {
                        // On final attempt failure, try to get from localStorage
                        try {
                            const cachedItems = localStorage.getItem(`request_${requestId}_items`)
                            if (cachedItems) {
                                const parsedItems = JSON.parse(cachedItems)
                                return parsedItems
                            }
                        } catch {
                            // Silently fail if localStorage retrieval fails
                        }
                        throw error // Re-throw on final failure
                    }
                }
            }

            // Check localStorage as a last resort
            try {
                const cachedItems = localStorage.getItem(`request_${requestId}_items`)
                if (cachedItems) {
                    const parsedItems = JSON.parse(cachedItems)
                    return parsedItems
                }
            } catch {
                // Silently fail if localStorage retrieval fails
            }

            // If all attempts returned empty arrays but no errors, return empty array
            return []
        } catch (error) {
            return [] // Return empty array on error
        }
    }
}

const backendConnection = new BackendConnection()
export default backendConnection
