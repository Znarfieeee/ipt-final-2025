import { useState, useCallback } from "react"

const useFakeBackend = () => {
    const [users] = useState([
        {
            id: 1,
            email: "admin@example.com",
            password: "admin",
            role: "Admin",
            employeeid: 1,
        },
        {
            id: 2,
            email: "user@example.com",
            password: "user",
            role: "User",
            employeeid: 2,
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
    ])

    const getUser = useCallback(
        (token) => {
            if (!token || token !== "fake-jwt-token") return null
            return users.find((u) => u.token === "fake-jwt-token")
        },
        [users]
    )

    const authorize = useCallback(
        (token, requiredRole, success) => {
            const user = getUser(token)
            if (!user) return { error: "Unauthorized" }
            if (requiredRole && user.role !== requiredRole)
                return { error: "Forbidden" }
            return success()
        },
        [getUser]
    )

    const handleRoute = useCallback(
        (url, method, token, body) => {
            // Accounts Routes
            if (url.endsWith("/accounts/authenticate") && method === "POST") {
                const { email, password } = body
                const user = users.find(
                    (u) => u.email === email && u.password === password
                )
                if (!user) return { error: "Invalid credentials" }
                return { ...user, token: "fake-jwt-token" }
            }

            if (url.endsWith("/accounts") && method === "GET") {
                return authorize(token, "Admin", () => users)
            }

            // Employees Routes
            if (url.endsWith("/employees") && method === "GET") {
                return authorize(token, null, () => employees)
            }

            if (url.match(/\/employees\/\d+$/) && method === "GET") {
                const id = parseInt(url.split("/").pop())
                const employee = employees.find((e) => e.id === id)
                return authorize(
                    token,
                    null,
                    () => employee || { error: "Employee not found" }
                )
            }

            if (url.match(/\/employees\/\d+$/) && method === "PUT") {
                return authorize(token, "Admin", () => {
                    const id = parseInt(url.split("/").pop())
                    const employeeIndex = employees.findIndex(
                        (e) => e.id === id
                    )
                    if (employeeIndex === -1)
                        return { error: "Employee not found" }
                    return { ...employees[employeeIndex], ...body }
                })
            }

            // Department Routes
            if (url.endsWith("/departments") && method === "GET") {
                return authorize(token, null, () => departments)
            }

            if (url.endsWith("/departments") && method === "POST") {
                return authorize(token, "Admin", () => {
                    const department = {
                        id: departments.length + 1,
                        ...body,
                        employeeCount: 0,
                    }
                    return department
                })
            }

            // Workflows Routes
            if (url.match(/\/workflows\/employee\/\d+$/) && method === "GET") {
                return authorize(token, null, () => {
                    const employeeId = parseInt(url.split("/").pop())
                    return workflows.filter((w) => w.employeeId === employeeId)
                })
            }

            if (url.endsWith("/workflows") && method === "POST") {
                return authorize(token, "Admin", () => {
                    const workflow = { id: workflows.length + 1, ...body }
                    setWorkflows((prev) => [...prev, workflow])
                    return workflow
                })
            }

            // Requests Routes
            if (url.endsWith("/requests") && method === "GET") {
                return authorize(token, "Admin", () => requests)
            }

            if (url.endsWith("/requests") && method === "POST") {
                return authorize(token, null, () => {
                    const user = getUser(token)
                    if (!user) return { error: "Unauthorized" }
                    const request = {
                        id: requests.length + 1,
                        employeeId: user.employeeid,
                        ...body,
                    }
                    setRequests((prev) => [...prev, request])
                    return request
                })
            }

            return { error: "Route not found" }
        },
        [users, employees, departments, workflows, requests, authorize, getUser]
    )

    const fakeFetch = useCallback(
        async (url, options = {}) => {
            const { method = "GET", body, headers = {} } = options
            const token = headers.Authorization?.replace("Bearer ", "")

            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 500))

            const response = handleRoute(url, method, token, body)

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
