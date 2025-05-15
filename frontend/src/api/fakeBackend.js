import { useState, useCallback } from "react"
import { USE_FAKE_BACKEND } from "./config"
import backendConnection from "./BackendConnection"

export const useFakeBackend = () => {
    const [users] = useState([
        {
            id: 1,
            title: "Mr",
            firstName: "John",
            lastName: "Doe",
            email: "admin@example.com",
            password: "admin",
            role: "Admin",
            status: "Active",
            employeeId: 1,
        },
        {
            id: 2,
            title: "Mrs",
            firstName: "Jane",
            lastName: "Doe",
            email: "user@example.com",
            password: "user",
            role: "User",
            status: "Inactive",
            employeeId: 2,
        },
    ])

    const [employees] = useState([
        {
            id: 1,
            employeeId: "EMP001",
            userId: 1,
            position: "Developer",
            departmentId: 1,
            hireDate: "2025-01-01",
            status: "Active",
        },
        {
            id: 2,
            employeeId: "EMP002",
            userId: 2,
            position: "Designer",
            departmentId: 2,
            hireDate: "2025-02-01",
            status: "Active",
        },
    ])

    const [departments] = useState([
        {
            id: 1,
            name: "Engineering",
            description: "Software development team",
            employeeCount: 1,
        },
        {
            id: 2,
            name: "Marketing",
            description: "Marketing team",
            employeeCount: 1,
        },
    ])

    const [workflows, setWorkflows] = useState([
        {
            id: 1,
            employeeId: 1,
            type: "Onboarding",
            details: { task: "Setup workstation" },
            status: "Pending",
        },
    ])

    const [requests, setRequests] = useState([
        {
            id: 1,
            employeeId: 2,
            type: "Equipment",
            requestItems: [{ name: "Laptop", quantity: 1 }],
            status: "Pending",
        },
        {
            id: 2,
            employeeId: 2,
            type: "Equipment",
            requestItems: [{ name: "Mouse", quantity: 3 }],
            status: "Approved",
        },
        {
            id: 3,
            employeeId: 1,
            type: "Leave",
            requestItems: [{ name: "Vacation", quantity: 2 }],
            status: "Denied",
        },
    ])

    const handleRoute = useCallback(
        (url, method, body) => {
            // Accounts Routes
            if (url.endsWith("/accounts") && method === "GET") {
                return users
            }

            // Employees Routes
            if (url.endsWith("/employees") && method === "GET") {
                return employees
            }

            if (url.match(/\/employees\/\d+$/) && method === "GET") {
                const id = parseInt(url.split("/").pop())
                const employee = employees.find(e => e.id === id)
                return employee || { error: "Employee not found" }
            }

            if (url.match(/\/employees\/\d+$/) && method === "PUT") {
                const id = parseInt(url.split("/").pop())
                const employeeIndex = employees.findIndex(e => e.id === id)
                if (employeeIndex === -1) return { error: "Employee not found" }
                return { ...employees[employeeIndex], ...body }
            }

            // Auth Employees Route
            if (url.endsWith("/auth/employees") && method === "GET") {
                return employees;
            }

            // Department Routes
            if (url.endsWith("/departments") && method === "GET") {
                return departments
            }

            if (url.endsWith("/departments") && method === "POST") {
                const department = {
                    id: departments.length + 1,
                    ...body,
                    employeeCount: 0,
                }
                return department
            }

            // Workflows Routes
            if (url.match(/\/workflows\/employee\/\d+$/) && method === "GET") {
                const employeeId = parseInt(url.split("/").pop())
                return workflows.filter(w => w.employeeId === employeeId)
            }

            if (url.endsWith("/workflows") && method === "POST") {
                const workflow = { id: workflows.length + 1, ...body }
                setWorkflows(prev => [...prev, workflow])
                return workflow
            }

            // Requests Routes
            if (url.endsWith("/requests") && method === "GET") {
                return requests
            }

            if (url.endsWith("/requests") && method === "POST") {
                const request = {
                    id: requests.length + 1,
                    employeeId: body.employeeId,
                    ...body,
                }
                setRequests(prev => [...prev, request])
                return request
            }

            return { error: "Route not found" }
        },
        [users, employees, departments, workflows, requests]
    )

    const fakeFetch = useCallback(
        async (url, options = {}) => {
            // If USE_FAKE_BACKEND is false, use the real backend
            if (!USE_FAKE_BACKEND) {
                try {
                    // Extract the endpoint from the URL
                    const endpoint = url.replace(/^(http|https):\/\/[^/]+/, '');
                    
                    // Call the corresponding method on backendConnection based on the URL and method
                    // This is a simplified version and might need to be expanded based on all your endpoints
                    if (endpoint === '/accounts' && options.method === 'GET') {
                        try {
                            // First try the special test endpoint
                            try {
                                const data = await backendConnection.getUsers();
                                console.log('Successfully fetched users:', data);
                                return {
                                    ok: true,
                                    status: 200,
                                    json: async () => data,
                                };
                            } catch (error) {
                                console.error("Backend API error:", error);
                                console.log('Falling back to fake users data');
                                // Return fake users as fallback with log
                                return {
                                    ok: true,
                                    status: 200,
                                    json: async () => users,
                                };
                            }
                        } catch (outerError) {
                            console.error("Critical error in accounts endpoint:", outerError);
                            // Last resort fallback
                            return {
                                ok: true,
                                status: 200,
                                json: async () => users,
                            };
                        }
                    } else if (endpoint.startsWith('/employees') && options.method === 'GET') {
                        return {
                            ok: true,
                            status: 200,
                            json: async () => await backendConnection.getEmployees(),
                        };
                    } else if (endpoint.startsWith('/departments') && options.method === 'GET') {
                        return {
                            ok: true,
                            status: 200,
                            json: async () => await backendConnection.getDepartments(),
                        };
                    } else if (endpoint.match(/\/workflows\/employee\/\d+$/) && options.method === 'GET') {
                        const employeeId = parseInt(endpoint.split('/').pop());
                        return {
                            ok: true,
                            status: 200,
                            json: async () => await backendConnection.getWorkflowsByEmployeeId(employeeId),
                        };
                    } else if (endpoint.startsWith('/requests') && options.method === 'GET') {
                        return {
                            ok: true,
                            status: 200,
                            json: async () => await backendConnection.getRequests(),
                        };
                    } else if (endpoint.startsWith('/requests') && options.method === 'POST') {
                        const result = await backendConnection.createRequest(options.body || {});
                        return {
                            ok: true,
                            status: 201,
                            json: async () => result,
                        };
                    } else if (endpoint.startsWith('/workflows') && options.method === 'POST') {
                        const result = await backendConnection.createWorkflow(options.body || {});
                        return {
                            ok: true,
                            status: 201,
                            json: async () => result,
                        };
                    } else if (endpoint.startsWith('/departments') && options.method === 'POST') {
                        const result = await backendConnection.createDepartment(options.body || {});
                        return {
                            ok: true,
                            status: 201,
                            json: async () => result,
                        };
                    }
                    
                    // If we don't have a specific handler, make a direct fetch to the backend
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ error: "Endpoint not implemented yet" }),
                    };
                } catch (error) {
                    console.error("Error calling real backend:", error);
                    return {
                        ok: false,
                        status: 500,
                        json: async () => ({ error: error.message }),
                    };
                }
            }

            // Use the fake backend logic below (original code)
            const { method = "GET" } = options

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500))

            const response = handleRoute(url, method)

            if (response.error) {
                throw new Error(response.error)
            }

            return {
                ok: true,
                status: 200,
                json: async () => response,
            }
        },
        [handleRoute]
    )

    return { fakeFetch }
}

export default useFakeBackend
