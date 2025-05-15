import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"

// Components
import EmployeeAddForm from "../components/EmployeeAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"

// UI Libraries
import { GoGitPullRequest, GoWorkflow } from "react-icons/go"
import { TbTransfer } from "react-icons/tb"
import { IoAddSharp } from "react-icons/io5"
import { CiEdit } from "react-icons/ci"

function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const { fakeFetch } = useFakeBackend()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both employees and users data
                const [employeesResponse, usersResponse] = await Promise.all([
                    fakeFetch("/employees", {
                        method: "GET",
                        body: "",
                    }),
                    fakeFetch("/accounts", {
                        method: "GET",
                        body: "",
                    }),
                ])

                const employeesData = await employeesResponse.json()
                const usersData = await usersResponse.json()

                if (employeesData.error) throw new Error(employeesData.error)
                if (usersData.error) throw new Error(usersData.error)

                // Combine employee data with user account details
                const employeesWithUserInfo = employeesData.map(employee => {
                    const user = usersData.find(user => user.employeeId === employee.employeeId)
                    const userType = user ? (user.role === "Admin" ? "Admin User" : "Normal User") : "Unknown User"
                    return {
                        ...employee,
                        userEmail: user ? `${user.email} (${userType})` : "No email assigned",
                    }
                })

                setEmployees(employeesWithUserInfo)
                setError(null)
            } catch (err) {
                console.error("Error fetching data: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [fakeFetch])

    const handleFormSubmit = async formData => {
        try {
            const method = editingUser ? "PUT" : "POST"
            const url = editingUser ? `/departments/${editingUser.id}` : "/employees"

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
            setEmployees(updatedData)

            // Show success message
            alert(`Employee ${editingUser ? "updated" : "created"} successfully!`)
            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error submitting department:", err)
            alert(err.message || "An error occurred while saving the department")
        }
    }

    function handleStatus(status) {
        const statusStyles = {
            Active: "bg-green-400",
            Inactive: "bg-red-400",
        }

        return (
            <span className={`px-3 py-1 rounded-full text-md font-medium text-white ${statusStyles[status]}`}>
                {status}
            </span>
        )
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

    const handleAdd = () => {
        setEditingUser(null)
        setShowForm(true)
    }

    const handleEdit = user => {
        setEditingUser(user)
        setShowForm(true)
    }

    const handleFormCancel = () => {
        setShowForm(false)
        setEditingUser(null)
    }

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div id="table-header" className="flex flex-row justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold capitalize text-foreground">EMPLOYEES</h1>
                    <ButtonWithIcon
                        icon={IoAddSharp}
                        text="Employee"
                        tooltipContent="Add New Employee"
                        onClick={handleAdd}
                        variant="primary"
                    />
                </div>
                <hr className="mb-4" />
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Employee ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Position
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Hire Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees && employees.length > 0 ? (
                            employees.map(employee => (
                                <tr key={employee.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {employee.employeeId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {employee.userEmail}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {employee.position}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {employee.departmentId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {employee.hireDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        {handleStatus(employee.status)}
                                    </td>
                                    <td className="flex px-6 py-4 whitespace-nowrap text-start gap-2">
                                        <ButtonWithIcon
                                            icon={GoGitPullRequest}
                                            text=""
                                            tooltipContent="Request"
                                            onClick={handleAdd}
                                            variant="orange"
                                        />
                                        <ButtonWithIcon
                                            icon={GoWorkflow}
                                            text=""
                                            tooltipContent="Workflows"
                                            onClick={handleAdd}
                                            variant="pink"
                                        />
                                        <ButtonWithIcon
                                            icon={TbTransfer}
                                            text=""
                                            tooltipContent="Transfer"
                                            onClick={handleAdd}
                                            variant="warning"
                                        />
                                        <ButtonWithIcon
                                            icon={CiEdit}
                                            text=""
                                            tooltipContent="Edit"
                                            onClick={handleEdit}
                                            variant="primary"
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-destructive">
                                    No employees found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showForm && (
                <EmployeeAddForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={editingUser} />
            )}
        </>
    )
}

export default Employees
