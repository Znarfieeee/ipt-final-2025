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
        const endpoints = ["/auth/users", "/auth/accounts", "/auth"]

        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting to fetch users from ${endpoint}`)
                const data = await this.fetchData(endpoint)
                if (data) {
                    console.log(`Successfully fetched users from ${endpoint}`)
                    return data
                }
            } catch (error) {
                console.warn(`Failed to fetch users from ${endpoint}:`, error)
                // Continue to next endpoint if this one fails
                continue
            }
        }

        // If we get here, all endpoints failed
        const error = new Error("Failed to fetch users from all available endpoints")
        showToast("error", "Failed to fetch users. Please try again later.")
        throw error
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
            console.error("Error creating user:", error)
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
            console.error("Error updating user:", error)
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
        return this.fetchData("/employees", {
            method: "POST",
            body: employeeData,
        })
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

    async createRequest(requestData) {
        return this.fetchData("/requests", {
            method: "POST",
            body: requestData,
        })
    }

    async updateRequest(id, requestData) {
        return this.fetchData(`/requests/${id}`, {
            method: "PUT",
            body: requestData,
        })
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

            // Check if response is OK before attempting to parse JSON
            if (!response.ok) {
                let errorMessage = response.statusText
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.message || errorData.error || response.statusText
                } catch (e) {
                    // If we can't parse the error as JSON, use the status text
                    console.warn("Could not parse error response as JSON:", e)
                }
                console.error(`HTTP error ${response.status}: ${errorMessage}`)
                throw new Error(`HTTP error ${response.status}: ${errorMessage}`)
            }

            // Check Content-Type header to handle possible HTML responses
            const contentType = response.headers.get("Content-Type")
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json()
                return data
            } else {
                console.warn(`Unexpected content type: ${contentType}`)
                return null
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            throw error
        }
    }

    async getAuthEmployees() {
        return this.fetchData("/auth/employees")
    }
}

const backendConnection = new BackendConnection()
export default backendConnection
