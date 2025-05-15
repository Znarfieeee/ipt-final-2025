import React, { useState } from "react"

function EmployeeAddEditForm({ onSubmit, onCancel, initialData }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
    })

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = e => {
        e.preventDefault()
        onSubmit?.(formData)
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
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="employeeId" className="block text-sm font-medium text-foreground mb-1">
                                    Account
                                </label>
                                <input
                                    type="text"
                                    id="account"
                                    name="account"
                                    value={formData.userEmail}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
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
                                <label htmlFor="department" className="block text-sm font-medium text-foreground mb-1">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="hireDate" className="block text-sm font-medium text-foreground mb-1">
                                    Hire Date
                                </label>
                                <input
                                    type="date"
                                    id="hireDate"
                                    name="hireDate"
                                    value={formData.hireDate}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
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
                                    {initialData ? "Update" : "Create"} Department
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
