import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import "../index.css"

// Components
import DepartmentAddEditForm from "../components/DepartmentAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"

// UI Libraries
import { CiEdit } from "react-icons/ci"
import { IoAddSharp } from "react-icons/io5"

function Department() {
    const [depts, setDepts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const { fakeFetch } = useFakeBackend()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fakeFetch("/departments", {
                    method: "GET",
                    body: "",
                })

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }

                setDepts(data)
                setError(null)
            } catch (err) {
                console.error("Error fetching department: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [fakeFetch])

    const handleAdd = () => {
        setEditingUser(null)
        setShowForm(true)
    }

    const handleEdit = department => {
        setEditingUser(department)
        setShowForm(true)
    }

    const handleFormSubmit = async formData => {
        try {
            const method = editingUser ? "PUT" : "POST"
            const url = editingUser ? `/departments/${editingUser.id}` : "/departments"

            const response = await fakeFetch(url, {
                method,
                body: formData,
            })

            const data = await response.json()
            if (data.error) {
                throw new Error(data.error)
            }

            // Refresh the departments list
            const updatedResponse = await fakeFetch("/departments")
            const updatedData = await updatedResponse.json()
            setDepts(updatedData)

            // Show success message
            alert(`Department ${editingUser ? "updated" : "created"} successfully!`)
            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error submitting department:", err)
            alert(err.message || "An error occurred while saving the department")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce200"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce400"></div>
                </div>
                <div className="text-center text-gray-500">Loading data...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-red-500">Error: {error}</p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div id="table-header" className="flex flex-row justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold capitalize text-foreground">DEPARTMENTS</h1>
                    <ButtonWithIcon
                        icon={IoAddSharp}
                        text="Department"
                        tooltipContent="Add New Department"
                        onClick={handleAdd}
                        variant="primary"
                    />
                </div>
                <hr />
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Employee Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {depts && depts.length > 0 ? (
                            depts.map(dept => (
                                <tr key={dept.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {dept.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {dept.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {dept.employeeCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        <ButtonWithIcon
                                            icon={CiEdit}
                                            text="Edit"
                                            tooltipContent="Edit Department"
                                            onClick={() => handleEdit(dept)}
                                            variant="primary"
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-destructive">
                                    No departments found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <DepartmentAddEditForm
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowForm(false)}
                    initialData={editingUser}
                />
            )}
        </>
    )
}

export default Department
