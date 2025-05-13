import React, { useState } from "react"

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ButtonWithIcon from "./ButtonWithIcon"
import { IoRemove } from "react-icons/io5"
import { IoAddSharp } from "react-icons/io5"

function RequestAddEditForm({ onSubmit, onCancel, initialData }) {
    const [formData, setFormData] = useState({
        type: initialData?.type || "",
        employeeId: initialData?.employeeId || "",
        requestItems: initialData?.requestItems || "",
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
                            {initialData ? "Edit" : "Add"} Account
                        </header>
                        <div className="space-y-4">
                            <div>
                                {" "}
                                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                                    Type
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "type", value } })}
                                    value={formData.type}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select request type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Equipment">Equipment</SelectItem>
                                        <SelectItem value="Leave">Leave</SelectItem>
                                        <SelectItem value="Resources">Resources</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                {" "}
                                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                                    Employee ID
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "type", value } })}
                                    value={formData.type}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select request type" />
                                    </SelectTrigger>
                                    <SelectContent>{/* Load Employees Dynamically */}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div>
                                    {" "}
                                    <div className="flex gap-px justify-between items-center">
                                        <label
                                            htmlFor="type"
                                            className="block text-sm font-medium text-foreground mb-1"
                                        >
                                            Items
                                        </label>
                                        <button className="flex gap-px items-center text-md hover:text-blue-400 cursor-pointer">
                                            <IoAddSharp /> Item
                                        </button>
                                    </div>
                                    <div className="border-1 flex gap-4 p-2">
                                        <div className="w-full">
                                            <label
                                                htmlFor="firstName"
                                                className="block text-sm font-medium text-foreground mb-1"
                                            >
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="w-full">
                                            <label
                                                htmlFor="lastName"
                                                className="block text-sm font-medium text-foreground mb-1"
                                            >
                                                Quantity
                                            </label>
                                            <input
                                                type="text"
                                                id="quantity"
                                                name="quantity"
                                                value={formData.quantity}
                                                defaultValue={1}
                                                onChange={handleChange}
                                                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button className="flex gap-px justify-center items-center text-sm py-2 hover:text-red-400 cursor-pointer">
                                                <IoRemove />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
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
                                    {initialData ? "Update" : "Create"} Request
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default RequestAddEditForm
