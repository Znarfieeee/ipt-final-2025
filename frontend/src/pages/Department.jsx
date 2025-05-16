import React, { useEffect, useState } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import "../index.css"

// Components
import DepartmentAddEditForm from "../components/DepartmentAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"

// UI Libraries
import { CiEdit } from "react-icons/ci"
import { IoAddSharp } from "react-icons/io5"
import { showToast } from "../util/alertHelper"

function Department() {
    const [depts, setDepts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const { fakeFetch } = useFakeBackend()

    const fetchDepartments = async () => {
        try {
            setLoading(true)
            console.log("Fetching departments...")

            let data
            if (!USE_FAKE_BACKEND) {
                // Use real backend
                data = await backendConnection.getDepartments()
            } else {
                // Use fake backend
                const response = await fakeFetch("/departments", {
                    method: "GET",
                    body: "",
                })

                if (!response.ok) {
                    throw new Error("Failed to fetch departments")
                }

                data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }
            }

            console.log("Departments fetched successfully:", data)
            setDepts(Array.isArray(data) ? data : [])
            setError(null)
        } catch (err) {
            console.error("Error fetching departments: ", err)
            setError("Failed to load departments. Please try again later.")
            showToast("error", "Failed to load departments. Please try again later.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDepartments()
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
            let result;
            
            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (editingUser?.id) {
                    // Pass id separately from the data
                    result = await backendConnection.updateDepartment(editingUser.id, formData)
                } else {
                    result = await backendConnection.createDepartment(formData)
                }

                console.log("API response:", result);
                
                // Immediately update the local state without waiting for a refetch
                if (editingUser?.id) {
                    // Update existing department in the state
                    setDepts(prevDepts => 
                        prevDepts.map(dept => 
                            dept.id === editingUser.id ? {...dept, ...formData} : dept
                        )
                    );
                } else if (result && result.id) {
                    // Add new department to the state
                    setDepts(prevDepts => [...prevDepts, result]);
                }
                
                // Refresh the departments list to ensure data consistency
                await fetchDepartments();
            } else {
                // Use fake backend
                const method = editingUser ? "PUT" : "POST"
                const url = editingUser ? `/departments/${editingUser.id}` : "/departments"

                const response = await fakeFetch(url, {
                    method,
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error("Failed to save department");
                }

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }

                // Update local state immediately
                if (editingUser) {
                    setDepts(prevDepts => 
                        prevDepts.map(dept => 
                            dept.id === editingUser.id ? {...dept, ...formData} : dept
                        )
                    );
                } else if (data && data.id) {
                    setDepts(prevDepts => [...prevDepts, data]);
                }

                // Refresh the departments list
                const updatedResponse = await fakeFetch("/departments")
                const updatedData = await updatedResponse.json()
                if (Array.isArray(updatedData)) {
                    setDepts(updatedData)
                }
            }

            // Show success message
            showToast("success", editingUser ? "Department updated successfully!" : "Department created successfully!")
            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error saving department:", err)
            // More specific error message
            const errorMessage = err.message || "An error occurred while saving the department"
            showToast("error", errorMessage)
        }
    }

    if (loading && depts.length === 0) {
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

    if (error && depts.length === 0) {
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
                {loading && (
                    <div className="flex justify-center my-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce mr-1"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce200 mr-1"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce400"></div>
                    </div>
                )}
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
                                        {dept.employeeCount || 0}
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
                                <td colSpan="4" className="px-6 py-4 text-center text-destructive">
                                    {loading ? "Loading departments..." : "No departments found"}
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
