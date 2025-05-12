import React, { useState } from "react"

function AccountsAddForm({ onSubmit, onCancel, initialData }) {
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        email: initialData?.email || "",
        role: initialData?.role || "",
        status: initialData?.status || "",
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <header className="text-2xl font-bold text-foreground mb-6">
                        {initialData ? "Edit" : "Add"} Account
                    </header>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-full">
                                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                            <div className="w-full">
                                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                required
                            >
                                <option value="employee">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status ? formData.status : "Inactive"}
                                onChange={handleChange}
                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                required
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
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
                            {initialData ? "Update" : "Create"} Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AccountsAddForm
