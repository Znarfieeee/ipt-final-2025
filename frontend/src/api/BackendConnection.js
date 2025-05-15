const BASE_URL = "http://localhost:3000/api";

class BackendConnection {
    // Authentication
    async login(email, password) {
        return this.fetchData('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    }

    async logout() {
        // Call the logout endpoint
        await this.fetchData('/auth/logout', {
            method: 'POST'
        });
        
        // Remove token from localStorage
        localStorage.removeItem('token');
    }

    // Users - Using auth endpoint for user management
    async getUsers() {
        try {
            // Try the users endpoint
            return await this.fetchData('/auth/users');
        } catch (error) {
            console.warn('Failed to fetch users from /auth/users, trying /auth/accounts:', error);
            try {
                // Try the accounts endpoint as fallback
                return await this.fetchData('/auth/accounts');
            } catch (secondError) {
                console.warn('Failed to fetch from /auth/accounts, trying root endpoint:', secondError);
                // Try the root endpoint as last resort
                return await this.fetchData('/auth');
            }
        }
    }

    async getUserById(id) {
        return this.fetchData(`/auth/users/${id}`);
    }

    async createUser(userData) {
        return this.fetchData('/auth/users', {
            method: 'POST',
            body: userData
        });
    }

    async updateUser(id, userData) {
        return this.fetchData(`/auth/users/${id}`, {
            method: 'PUT',
            body: userData
        });
    }

    // Employees
    async getEmployees() {
        return this.fetchData('/employees');
    }

    async getEmployeeById(id) {
        return this.fetchData(`/employees/${id}`);
    }

    async createEmployee(employeeData) {
        return this.fetchData('/employees', {
            method: 'POST',
            body: employeeData
        });
    }

    async updateEmployee(id, employeeData) {
        return this.fetchData(`/employees/${id}`, {
            method: 'PUT',
            body: employeeData
        });
    }

    // Departments
    async getDepartments() {
        return this.fetchData('/departments');
    }

    async getDepartmentById(id) {
        return this.fetchData(`/departments/${id}`);
    }

    async createDepartment(departmentData) {
        return this.fetchData('/departments', {
            method: 'POST',
            body: departmentData
        });
    }

    async updateDepartment(id, departmentData) {
        return this.fetchData(`/departments/${id}`, {
            method: 'PUT',
            body: departmentData
        });
    }

    // Workflows
    async getWorkflows() {
        return this.fetchData('/workflows');
    }

    async getWorkflowsByEmployeeId(employeeId) {
        return this.fetchData(`/workflows/employee/${employeeId}`);
    }

    async createWorkflow(workflowData) {
        return this.fetchData('/workflows', {
            method: 'POST',
            body: workflowData
        });
    }

    async updateWorkflow(id, workflowData) {
        return this.fetchData(`/workflows/${id}/status`, {
            method: 'PUT',
            body: workflowData
        });
    }

    // Requests
    async getRequests() {
        return this.fetchData('/requests');
    }

    async getRequestById(id) {
        return this.fetchData(`/requests/${id}`);
    }

    async createRequest(requestData) {
        return this.fetchData('/requests', {
            method: 'POST',
            body: requestData
        });
    }

    async updateRequest(id, requestData) {
        return this.fetchData(`/requests/${id}`, {
            method: 'PUT',
            body: requestData
        });
    }

    // Helper method for making API requests
    async fetchData(endpoint, options = {}) {
        try {
            const url = `${BASE_URL}${endpoint}`;
            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            // Add token if available
            const token = localStorage.getItem('token');
            if (token) {
                fetchOptions.headers.Authorization = `Bearer ${token}`;
            }

            // Add body if provided
            if (options.body) {
                fetchOptions.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, fetchOptions);
            
            // Handle 401 Unauthorized by redirecting to login
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return null;
            }

            // Check Content-Type header to handle possible HTML responses 
            const contentType = response.headers.get('Content-Type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }
                
                return data;
            } else {
                // Handle non-JSON response
                const text = await response.text();
                console.error('Received non-JSON response:', text.substring(0, 100) + '...');
                throw new Error('Server returned non-JSON response. The server might be down or misconfigured.');
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

const backendConnection = new BackendConnection();
export default backendConnection;
