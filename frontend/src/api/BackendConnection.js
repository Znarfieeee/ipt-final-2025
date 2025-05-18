import { showToast } from "../util/alertHelper"

// Hard code the production URL since the app is already deployed
const BASE_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://ipt-final-2025-backend-17bh.onrender.com"

class BackendConnection {
    // Helper method to get the base URL
    getBaseUrl() {
        return BASE_URL
    }

    // Authentication
    async login(email, password) {
        try {
            // Make direct fetch request for login to avoid error handling issues
            const response = await fetch(`${BASE_URL}/accounts/authenticate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include", // Important for cookies
            })

            // Handle non-OK responses
            if (!response.ok) {
                // Check specifically for 401 status which might be a verification issue
                if (response.status === 401) {
                    // Try to parse the response body for more details
                    try {
                        const errorData = await response.json()
                        const errorMsg = errorData.message || errorData.error || ""

                        // Check for verification-related keywords in the error message
                        if (
                            errorMsg.toLowerCase().includes("not verified") ||
                            errorMsg.toLowerCase().includes("verify") ||
                            errorMsg.toLowerCase().includes("verification")
                        ) {
                            throw new Error("Please verify your email before logging in")
                        }

                        // For other 401 errors (like wrong password)
                        throw new Error(errorMsg || "Invalid email or password")
                    } catch (jsonError) {
                        // If we can't parse the JSON, assume it's a verification issue
                        // This helps ensure users get helpful messages even if the server response is unclear
                        throw new Error("Please verify your email before logging in")
                    }
                }

                // For other error status codes
                let errorMsg = "Login failed"
                try {
                    const errorData = await response.json()
                    errorMsg = errorData.message || errorData.error || errorMsg

                    // Special handling for account status errors
                    if (errorMsg.includes("inactive") || errorMsg.includes("suspended")) {
                        throw new Error("Account status issue: " + errorMsg)
                    }
                } catch (error) {
                    // If we can't parse JSON, just use status text
                    errorMsg = response.statusText || errorMsg
                }
                throw new Error(errorMsg)
            }

            // Parse the JSON response
            const result = await response.json()

            // Handle different response formats more flexibly
            if (result) {
                // If we have a token in the response, store it
                if (result.token) {
                    localStorage.setItem("token", result.token)
                } else if (result.jwtToken) {
                    localStorage.setItem("token", result.jwtToken)
                }

                // Handle user info (it might be directly in result or in result.user)
                const userInfo = result.user || result

                if (userInfo) {
                    localStorage.setItem("userInfo", JSON.stringify(userInfo))
                }

                return {
                    token: result.token || result.jwtToken,
                    user: userInfo,
                }
            } else {
                throw new Error("Invalid response from server")
            }
        } catch (error) {
            console.error("Login error:", error)
            throw error
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Registration failed")
            }

            return data
        } catch (error) {
            console.error("Registration error:", error)
            throw error
        }
    }

    async verifyEmail(token) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/verify-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Email verification failed")
            }

            return data
        } catch (error) {
            console.error("Email verification error:", error)
            throw error
        }
    }

    async forgotPassword(email) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Forgot password request failed")
            }

            return data
        } catch (error) {
            console.error("Forgot password error:", error)
            throw error
        }
    }

    async resetPassword(token, password, confirmPassword) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, password, confirmPassword }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Password reset failed")
            }

            return data
        } catch (error) {
            console.error("Password reset error:", error)
            throw error
        }
    }

    async logout() {
        try {
            // Check if a token exists before trying to revoke it
            const token = localStorage.getItem("refreshToken") || localStorage.getItem("token")

            if (token) {
                // Call the revoke token endpoint
                await this.fetchData("/api/auth/revoke-token", {
                    method: "POST",
                    body: { token },
                    skipAuthRedirect: true, // Skip redirect on error
                })
            }
        } catch (error) {
            console.error("Logout error:", error)
            // Continue with logout even if the API call fails
        } finally {
            // Always remove token from localStorage even if API call fails
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("userInfo")
        }
    }

    // Users management
    async getUsers() {
        try {
            return await this.fetchData("/api/auth")
        } catch (error) {
            console.error("Failed to fetch users:", error)

            // Return fallback data if needed
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

            showToast("warning", "Using offline user data. Some features may be limited.")
            return fallbackUsers
        }
    }

    async getUserById(id) {
        return this.fetchData(`/api/auth/${id}`)
    }

    async createUser(userData) {
        return this.fetchData("/api/auth/register", {
            method: "POST",
            body: userData,
        })
    }

    async updateUser(id, userData) {
        return this.fetchData(`/accounts/${id}`, {
            method: "PUT",
            body: userData,
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

    async deleteEmployee(id) {
        return this.fetchData(`/employees/${id}`, {
            method: "DELETE",
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

    async deleteDepartment(id) {
        return this.fetchData(`/departments/${id}`, {
            method: "DELETE",
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

    async updateWorkflowStatus(id, statusData) {
        return this.fetchData(`/workflows/${id}/status`, {
            method: "PUT",
            body: statusData,
        })
    }

    async initiateOnboarding(employeeData) {
        return this.fetchData("/workflows/onboarding", {
            method: "POST",
            body: employeeData,
        })
    }

    // Requests
    async getRequests() {
        return this.fetchData("/requests")
    }

    async getRequestsByEmployeeId(employeeId) {
        return this.fetchData(`/requests/employee/${employeeId}`)
    }

    // Get a specific request by ID - with retries to handle potential item fetch issues
    async getRequestById(id) {
        // Try up to 3 times to get the request with its items
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(`${BASE_URL}/api/requests/${id}`, {
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
    }

    // Track in-progress requests to prevent duplicates
    _pendingRequests = new Set()

    async createRequest(requestData) {
        const requestKey = `create_${requestData.type}_${
            requestData.employeeId || requestData.EmployeeId
        }_${Date.now()}`

        // Check if this exact request is already being processed
        if (this._pendingRequests.has(requestKey)) {
            return null
        }

        // Mark this request as in progress
        this._pendingRequests.add(requestKey)

        try {
            // IMPORTANT FIX: Clean & format request items before sending
            const cleanedData = this._cleanRequestItems(requestData)

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
        } finally {
            // Clear the pending request marker after a short delay
            // to prevent immediate re-submission
            setTimeout(() => {
                this._pendingRequests.delete(requestKey)
            }, 2000)
        }
    }

    // Update a request
    async updateRequest(id, requestData) {
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

        try {
            // Use direct fetch for more reliable results
            const response = await fetch(`${BASE_URL}/api/requests/${id}`, {
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
            } catch (_) {
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
                } catch (_) {
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

    // Add method to validate token
    async validateToken() {
        try {
            const refreshToken = localStorage.getItem("refreshToken") || localStorage.getItem("token")

            if (!refreshToken) {
                return { valid: false, error: "No token available" }
            }

            const result = await this.fetchData("/accounts/validate-token", {
                method: "GET",
                skipAuthRedirect: true, // Skip automatic redirect to handle it in the auth context
            })

            // If we get a new token, update localStorage
            if (result && result.token) {
                localStorage.setItem("token", result.token)

                // Also store the refresh token if provided
                if (result.refreshToken) {
                    localStorage.setItem("refreshToken", result.refreshToken)
                }

                return { valid: true, user: result.user || null }
            }

            // If result exists but no new token, check if it's explicitly invalid
            if (result && result.valid === false) {
                // Clear authentication data
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("userInfo")

                // Dispatch auth error event
                const authErrorEvent = new CustomEvent("auth:error", {
                    detail: { status: 401, message: "Token validation failed" },
                })
                window.dispatchEvent(authErrorEvent)

                // Return validation status
                return { valid: false, error: result.message || "Invalid token" }
            }

            // Default success if we got a result but no token (unlikely case)
            return { valid: true }
        } catch (error) {
            console.error("Token validation error:", error)

            // Clear authentication data
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("userInfo")

            // Dispatch auth error event
            const authErrorEvent = new CustomEvent("auth:error", {
                detail: { status: 0, message: "Token validation error" },
            })
            window.dispatchEvent(authErrorEvent)

            return { valid: false, error: error.message }
        }
    }

    // Helper method for making API requests
    async fetchData(endpoint, options = {}) {
        // Handle endpoints properly
        if (!endpoint.startsWith("/api") && !endpoint.startsWith("http")) {
            // For account-related endpoints
            if (endpoint.startsWith("/accounts")) {
                endpoint = `${endpoint}`
            }
            // For employee-related endpoints
            else if (endpoint.startsWith("/employees")) {
                endpoint = `/api${endpoint}`
            }
            // For department-related endpoints
            else if (endpoint.startsWith("/departments")) {
                endpoint = `/api${endpoint}`
            }
            // For requests-related endpoints
            else if (endpoint.startsWith("/requests")) {
                endpoint = `/api${endpoint}`
            }
            // For workflows-related endpoints
            else if (endpoint.startsWith("/workflows")) {
                endpoint = `/api${endpoint}`
            }
            // For any other endpoints
            else if (!endpoint.startsWith("/api")) {
                endpoint = `${endpoint}`
            }
        }

        const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`
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

        try {
            const response = await fetch(url, fetchOptions)

            // Handle 401 Unauthorized or 403 Forbidden by redirecting to login
            if ((response.status === 401 || response.status === 403) && !options.skipAuthRedirect) {
                console.warn(`Authentication error (${response.status}) - redirecting to login`)

                // Clear authentication data
                localStorage.removeItem("token")
                localStorage.removeItem("userInfo")

                // Dispatch a custom event that can be listened to by other components
                const authErrorEvent = new CustomEvent("auth:error", {
                    detail: { status: response.status, message: "Authentication failed" },
                })
                window.dispatchEvent(authErrorEvent)

                // Redirect to login page
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
                    // Try to get text content if JSON parsing fails
                    try {
                        const textContent = await response.text()
                        if (textContent) {
                            responseData = { message: textContent }
                        }
                    } catch (_) {
                        // If all parsing fails, create basic response
                        responseData = {
                            ok: response.ok,
                            status: response.status,
                            statusText: response.statusText,
                        }
                    }
                }
            } else {
                // Try to get text content for non-JSON responses
                try {
                    const textContent = await response.text()
                    responseData = { message: textContent }
                } catch (_) {
                    responseData = {
                        ok: response.ok,
                        status: response.status,
                        statusText: response.statusText,
                    }
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
            // Add more context to the error
            if (!error.status) {
                error.status = 0
                error.message = `Network error: ${error.message}`
            }

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

    // Get request items directly by request ID
    async getRequestItems(requestId) {
        try {
            // Try up to 5 times with increasing timeouts
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    // Use direct fetch for more reliable results
                    const response = await fetch(`${BASE_URL}/api/requests/${requestId}/items`, {
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
                        } catch (_) {
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
                                return JSON.parse(cachedItems)
                            }
                        } catch (_) {
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
                    return JSON.parse(cachedItems)
                }
            } catch (_) {
                // Silently fail if localStorage retrieval fails
            }

            // If all attempts returned empty arrays but no errors, return empty array
            return []
        } catch (_) {
            return [] // Return empty array on error
        }
    }

    async deleteRequest(id) {
        return this.fetchData(`/requests/${id}`, {
            method: "DELETE",
        })
    }

    async resendVerification(email) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Failed to resend verification email")
            }

            return data
        } catch (error) {
            console.error("Resend verification error:", error)
            throw error
        }
    }

    // Profile management methods
    async updateProfile(id, profileData) {
        try {
            // Make sure we're calling the right endpoint format
            // For backend compatibility, try both API format and non-API format
            let response
            try {
                response = await this.fetchData(`/api/auth/${id}`, {
                    method: "PUT",
                    body: profileData,
                })
            } catch (apiError) {
                // If API format fails, try non-API format
                console.log("API format failed, trying non-API format", apiError)
                response = await this.fetchData(`/accounts/${id}`, {
                    method: "PUT",
                    body: profileData,
                })
            }

            return response
        } catch (error) {
            console.error("Failed to update profile:", error)
            throw error
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            // Get current user info
            const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")

            if (!userInfo.id) {
                throw new Error("User information not found. Please log in again.")
            }

            console.log("Attempting direct password update for user ID:", userInfo.id)

            // Use the update user endpoint directly - this bypasses current password validation
            const response = await this.fetchData(`/accounts/${userInfo.id}`, {
                method: "PUT",
                body: {
                    password: newPassword,
                    confirmPassword: newPassword,
                },
            })

            return response
        } catch (error) {
            console.error("Failed to change password:", error)
            throw error
        }
    }

    async getActiveSessions() {
        try {
            return await this.fetchData("/api/auth/sessions")
        } catch (error) {
            console.error("Failed to fetch active sessions:", error)
            throw error
        }
    }

    async logoutSession(sessionId) {
        try {
            await this.fetchData(`/api/auth/sessions/${sessionId}`, {
                method: "DELETE",
            })
        } catch (error) {
            console.error("Failed to logout session:", error)
            throw error
        }
    }

    async logoutAllSessions() {
        try {
            await this.fetchData("/api/auth/sessions/revoke-all", {
                method: "POST",
            })
        } catch (error) {
            console.error("Failed to logout all sessions:", error)
            throw error
        }
    }
}

const backendConnection = new BackendConnection()
export default backendConnection
