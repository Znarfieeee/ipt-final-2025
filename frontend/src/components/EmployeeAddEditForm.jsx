import React, { useState, useEffect } from "react"
import { DatePicker } from "./ui/date-picker"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import { useFakeBackend } from "../api/fakeBackend"
import { showToast } from "../util/alertHelper"

function EmployeeAddEditForm({ onSubmit, onCancel, initialData }) {
    const { fakeFetch } = useFakeBackend()
    const [departments, setDepartments] = useState([])
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({
        employeeId: initialData?.employeeId || "",
        userEmail: "", // This will be set in useEffect when we have the users data
        userId: initialData?.userId || "",
        position: initialData?.position || "",
        DepartmentId: initialData?.DepartmentId ? String(initialData.DepartmentId) : "",
        hireDate: initialData?.hireDate ? new Date(initialData.hireDate) : new Date(),
        status: initialData?.status || "Active",
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                let departmentsData = []
                let usersData = []

                if (!USE_FAKE_BACKEND) {
                    // Use real backend
                    const [deptsResponse, usersResponse] = await Promise.all([
                        backendConnection.getDepartments(),
                        backendConnection.getUsers(),
                    ])
                    departmentsData = Array.isArray(deptsResponse) ? deptsResponse : []
                    usersData = Array.isArray(usersResponse) ? usersResponse : []
                } else {
                    // Use fake backend
                    const [deptsResponse, usersResponse] = await Promise.all([
                        fakeFetch("/departments"),
                        fakeFetch("/accounts"),
                    ])

                    const [depts, users] = await Promise.all([deptsResponse.json(), usersResponse.json()])
                    departmentsData = Array.isArray(depts) ? depts : []
                    usersData = Array.isArray(users) ? users : []
                }

                setDepartments(departmentsData)
                setUsers(usersData)

                // If editing, set user email and other fields
                if (initialData) {
                    const user = usersData.find(u => u.id === initialData.userId)
                    if (user) {
                        setFormData(prev => ({
                            ...prev,
                            userEmail: user.email || "",
                            userId: user.id || "",
                            position: initialData.position || "",
                            DepartmentId: initialData.DepartmentId ? String(initialData.DepartmentId) : "",
                            hireDate: initialData.hireDate ? new Date(initialData.hireDate) : new Date(),
                            status: initialData.status || "Active",
                        }))
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err)
                showToast("error", "Failed to load form data")
                setDepartments([])
                setUsers([])
            }
        }
        fetchData()
    }, [fakeFetch, initialData])

    const handleChange = e => {
        const { name, value } = e.target
        if (name === "userEmail") {
            const selectedUser = users.find(user => user.email === value)
            setFormData(prev => ({
                ...prev,
                userEmail: value || "",
                userId: selectedUser?.id || "",
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value || "",
            }))
        }
    }

    const handleDateChange = date => {
        setFormData(prev => ({
            ...prev,
            hireDate: date || new Date(),
        }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            const submitData = {
                ...formData,
                DepartmentId: formData.DepartmentId ? Number(formData.DepartmentId) : "",
                hireDate:
                    formData.hireDate instanceof Date
                        ? formData.hireDate.toLocaleDateString("en-CA")
                        : new Date().toLocaleDateString("en-CA"),
            }

            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (initialData?.id) {
                    // Pass id separately from the data
                    await backendConnection.updateEmployee(initialData.id, submitData)
                } else {
                    await backendConnection.createEmployee(submitData)
                }
            }

            onSubmit?.(submitData)
            showToast("success", initialData ? "Employee updated successfully!" : "Employee added successfully!")
        } catch (err) {
            console.error("Error submitting employee:", err)
            showToast("error", err.message || "Failed to save employee")
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <header className="text-2xl font-bold text-foreground mb-6">
                            {initialData ? "Edit" : "Add"} Employee
                        </header>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="employeeId" className="block text-sm font-medium text-foreground mb-1">
                                    Employee ID
                                </label>
                                <input
                                    type="text"
                                    id="employeeId"
                                    name="employeeId"
                                    value={formData.employeeId || ""}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    readOnly
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="userEmail" className="block text-sm font-medium text-foreground mb-1">
                                    Account
                                </label>
                                <select
                                    id="userEmail"
                                    name="userEmail"
                                    value={formData.userEmail || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                >
                                    <option value="">Select an account</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.email}>
                                            {user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-foreground mb-1">
                                    Position
                                </label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={formData.position || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="DepartmentId"
                                    className="block text-sm font-medium text-foreground mb-1"
                                >
                                    Department
                                </label>
                                <select
                                    id="DepartmentId"
                                    name="DepartmentId"
                                    value={formData.DepartmentId || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                >
                                    <option value="">Select a department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="hireDate" className="block text-sm font-medium text-foreground mb-1">
                                    Hire Date
                                </label>
                                <DatePicker
                                    date={formData.hireDate || new Date()}
                                    setDate={handleDateChange}
                                    className="bg-background border-input"
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status || "Active"}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-between space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-4 py-2 rounded-md bg-red-400 text-secondary-foreground hover:bg-red-600 hover:text-background transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors"
                                >
                                    {initialData ? "Update" : "Create"} Employee
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default EmployeeAddEditForm
