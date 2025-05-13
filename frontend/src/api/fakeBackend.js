import { useState, useCallback } from "react"

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
