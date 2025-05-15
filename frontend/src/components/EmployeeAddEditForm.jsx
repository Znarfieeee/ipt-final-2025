import React, { useState, useEffect } from "react"
import { DatePicker } from "./ui/date-picker"
import { useFakeBackend } from "../api/fakeBackend"

function EmployeeAddEditForm({ onSubmit, onCancel, initialData }) {
    const { fakeFetch } = useFakeBackend()
    const [departments, setDepartments] = useState([])
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({
        employeeId: initialData?.employeeId || "",
        userEmail: "", // This will be set in useEffect when we have the users data
        userId: initialData?.userId || "",
        position: initialData?.position || "",
        departmentId: initialData?.departmentId ? initialData.departmentId.toString() : "",
        hireDate: initialData?.hireDate ? new Date(initialData.hireDate) : null,
        status: initialData?.status || "Active",
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptsResponse, usersResponse] = await Promise.all([
                    fakeFetch("/departments"),
                    fakeFetch("/accounts"),
                ])

                const [departments, users] = await Promise.all([
                    deptsResponse.json(),
                    usersResponse.json(),
                ])

                // Ensure both departments and users are arrays before setting them
                setDepartments(Array.isArray(departments) ? departments : [])
                setUsers(Array.isArray(users) ? users : [])

                // If editing, set user email and other fields
                if (initialData) {
                    const user = users.find(u => u.id === initialData.userId)
                    if (user) {
                        setFormData(prev => ({
                            ...prev,
                            userEmail: user.email,
                            userId: user.id,
                            position: initialData.position,
                            departmentId: initialData.departmentId.toString(),
                            hireDate: initialData.hireDate ? new Date(initialData.hireDate) : null,
                            status: initialData.status,
                        }))
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err)
                setDepartments([]) // Set fallback empty arrays in case of error
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
                userEmail: value,
                userId: selectedUser?.id || "",
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }))
        }
    }

    const handleDateChange = date => {
        setFormData(prev => ({
            ...prev,
            hireDate: date,
        }))
    }

    const handleSubmit = e => {
        e.preventDefault()
        const submitData = {
            ...formData,
            departmentId: Number(formData.departmentId),
            hireDate: formData.hireDate ? formData.hireDate.toISOString().split("T")[0] : null,
        }

        if (initialData?.id) {
            submitData.id = initialData.id
        }

        onSubmit?.(submitData)
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
                                    value={formData.employeeId}
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
                                    value={formData.userEmail}
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
                                    value={formData.position}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="departmentId"
                                    className="block text-sm font-medium text-foreground mb-1"
                                >
                                    Department
                                </label>
                                <select
                                    id="departmentId"
                                    name="departmentId"
                                    value={formData.departmentId}
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
                                    date={formData.hireDate}
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
                                    value={formData.status}
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
