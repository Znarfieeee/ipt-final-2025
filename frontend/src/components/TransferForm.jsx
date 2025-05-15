import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"

function TransferForm({ initialData, onSubmit, onCancel }) {
    const { fakeFetch } = useFakeBackend()
    const [departments, setDepartments] = useState([])
    const [formData, setFormData] = useState({
        departmentId: "",
    })

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fakeFetch("/departments")
                const data = await response.json()
                setDepartments(data)
            } catch (err) {
                console.error("Error fetching departments:", err)
            }
        }
        fetchDepartments()
    }, [fakeFetch])

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = e => {
        e.preventDefault()
        onSubmit({
            ...formData,
            departmentId: parseInt(formData.departmentId),
        })
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <header className="text-2xl font-bold text-foreground mb-6">
                            Transfer Employee: {initialData.employeeId}
                        </header>
                        <div className="space-y-4">
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
                                    Transfer
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default TransferForm
