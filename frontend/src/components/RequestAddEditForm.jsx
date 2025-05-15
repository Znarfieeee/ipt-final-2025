import React, { useState, useEffect } from "react"

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ButtonWithIcon from "./ButtonWithIcon"
import { IoRemove } from "react-icons/io5"
import { IoAddSharp } from "react-icons/io5"
import { useFakeBackend } from "../api/fakeBackend"

function RequestAddEditForm({ onSubmit, onCancel, initialData }) {
    const { fakeFetch } = useFakeBackend()
    const [employees, setEmployees] = useState([])
    const [formData, setFormData] = useState({
        type: initialData?.type || "",
        employeeId: initialData?.employeeId || "",
        requestItems: initialData?.requestItems || [
            {
                name: "",
                quantity: 1,
            },
        ],
    })

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await fakeFetch("/employees")
                const data = await response.json()
                setEmployees(data)
            } catch (error) {
                console.error("Error fetching employees:", error)
            }
        }
        fetchEmployees()
    }, [fakeFetch])

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            // Validate form data
            if (!formData.type || !formData.employeeId) {
                throw new Error("Please select a request type and employee")
            }

            const validItems = formData.requestItems.filter(item => item.name && item.quantity > 0)
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item with a name and quantity")
            }

            // Prepare request data with valid items only
            const requestData = {
                ...formData,
                requestItems: validItems,
                status: initialData?.status || "Pending",
            }

            const method = initialData ? "PUT" : "POST"
            const url = initialData ? `/requests/${initialData.id}` : "/requests"

            const response = await fakeFetch(url, {
                method,
                body: requestData,
            })

            const data = await response.json()
            if (data.error) {
                throw new Error(data.error)
            }

            // Show success feedback and call onSubmit
            alert("Request " + (initialData ? "updated" : "created") + " successfully!")
            onSubmit?.(data)
        } catch (error) {
            console.error("Error submitting request:", error)
            alert(error.message || "An error occurred while submitting the request")
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg max-w-[40%] w-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <header className="text-2xl font-bold text-foreground mb-6">
                            {initialData ? "Edit" : "Add"} Request
                        </header>
                        <div className="space-y-4">
                            <div className="item">
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
                                <label htmlFor="employeeId" className="block text-sm font-medium text-foreground mb-1">
                                    Employee ID
                                </label>
                                <Select
                                    onValueChange={value => handleChange({ target: { name: "employeeId", value } })}
                                    value={formData.employeeId}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.id.toString()}>
                                                {employee.employeeId} - {employee.position}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div>
                                    <div className="flex gap-px justify-between items-center">
                                        <label
                                            htmlFor="type"
                                            className="block text-sm font-medium text-foreground mb-1"
                                        >
                                            Items
                                        </label>{" "}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newItem = { name: "", quantity: 1 }
                                                setFormData(prev => ({
                                                    ...prev,
                                                    requestItems: Array.isArray(prev.requestItems)
                                                        ? [...prev.requestItems, newItem]
                                                        : [newItem],
                                                }))
                                            }}
                                            className="flex gap-px items-center text-md hover:text-blue-400 cursor-pointer"
                                        >
                                            <IoAddSharp /> Add Item
                                        </button>
                                    </div>
                                    {(Array.isArray(formData.requestItems) ? formData.requestItems : []).map(
                                        (item, index) => (
                                            <div key={index} className="border-1 flex gap-4 p-2 mb-2">
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`name-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`name-${index}`}
                                                        value={item.name}
                                                        onChange={e => {
                                                            const newItems = [...formData.requestItems]
                                                            newItems[index].name = e.target.value
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <label
                                                        htmlFor={`quantity-${index}`}
                                                        className="block text-sm font-medium text-foreground mb-1"
                                                    >
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id={`quantity-${index}`}
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...formData.requestItems]
                                                            newItems[index].quantity = parseInt(e.target.value) || 1
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newItems = formData.requestItems.filter(
                                                                (_, i) => i !== index
                                                            )
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                requestItems: newItems,
                                                            }))
                                                        }}
                                                        className="flex gap-px justify-center items-center text-sm py-2 hover:text-red-400 cursor-pointer"
                                                    >
                                                        <IoRemove />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
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
