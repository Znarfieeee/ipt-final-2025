import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import { useNavigate } from "react-router-dom"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import { showToast } from "../util/alertHelper"
// Components
import EmployeeAddForm from "../components/EmployeeAddEditForm"
import ButtonWithIcon from "../components/ButtonWithIcon"
import TransferForm from "../components/TransferForm"
import WorkflowsForm from "../components/WorkflowsForm"

// UI Libraries
import { GoGitPullRequest, GoWorkflow } from "react-icons/go"
import { TbTransfer } from "react-icons/tb"
import { IoAddSharp } from "react-icons/io5"
import { CiEdit } from "react-icons/ci"
import { FaTrash } from "react-icons/fa"

function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [showTransferForm, setShowTransferForm] = useState(false)
    const [transferringEmployee, setTransferringEmployee] = useState(null)
    const [showWorkflowsForm, setShowWorkflowsForm] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const { fakeFetch } = useFakeBackend()
    const navigate = useNavigate()

    const loadEmployeesData = async () => {
        try {
            let employeesData = []
            let usersData = []
            let departmentsData = []

            if (!USE_FAKE_BACKEND) {
                const [employeesResponse, usersResponse, departmentsResponse] = await Promise.all([
                    backendConnection.getEmployees(),
                    backendConnection.getUsers(),
                    backendConnection.getDepartments(),
                ])
                employeesData = Array.isArray(employeesResponse) ? employeesResponse : []
                usersData = Array.isArray(usersResponse) ? usersResponse : []
                departmentsData = Array.isArray(departmentsResponse) ? departmentsResponse : []
            } else {
                // Use fake backend
                const [employeesResponse, usersResponse] = await Promise.all([
                    fakeFetch("/employees", { method: "GET", body: "" }),
                    fakeFetch("/accounts", { method: "GET", body: "" }),
                ])

                const [employees, users] = await Promise.all([employeesResponse.json(), usersResponse.json()])
                employeesData = Array.isArray(employees) ? employees : []
                usersData = Array.isArray(users) ? users : []
            }

            // Combine employee data with user and department info
            const employeesWithUserInfo = employeesData.map(employee => {
                const user = usersData.find(user => user && user.id === employee.userId)
                const department = departmentsData.find(dept => dept.id === employee.DepartmentId)
                return {
                    ...employee,
                    userEmail: user ? `${user.email}` : "No email assigned",
                    departmentName: department ? department.name : "Unknown",
                }
            })

            setEmployees(employeesWithUserInfo)
            setError(null)
        } catch (err) {
            console.error("Error fetching data: ", err)
            setError(err.message)
            showToast("error", "Failed to load employees")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEmployeesData()
    }, [fakeFetch])

    const handleFormSubmit = async formData => {
        try {
            setLoading(true)

            // Directly update the UI with the enriched data from the form
            const newEmployee = {
                ...formData,
                // Ensure all required fields are present
                id: formData.id || Date.now(),
                employeeId: formData.employeeId,
                userEmail: formData.userEmail || "No email assigned",
                position: formData.position || "Not specified",
                departmentName: formData.departmentName || "Unknown",
                hireDate: formData.hireDate || new Date().toISOString(),
                status: formData.status || "Active",
            }

            // If editing, update the existing employee in the array
            if (editingUser?.id) {
                setEmployees(prevEmployees => prevEmployees.map(emp => (emp.id === editingUser.id ? newEmployee : emp)))
            } else {
                // Add the new employee to the list
                setEmployees(prevEmployees => [...prevEmployees, newEmployee])
            }

            // Close the form
            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error handling employee data:", err)
            showToast("error", "Failed to process employee data")
        } finally {
            setLoading(false)
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

    if (loading && employees.length === 0) {
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

    if (error && employees.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-red-500">Error: {error}</p>
            </div>
        )
    }
    const getNextEmployeeId = () => {
        try {
            // If no employees exist, start with EMP001
            if (!employees || employees.length === 0) {
                return "EMP001"
            }

            // Find the highest employee ID
            let maxNumber = 0
            employees.forEach(employee => {
                if (employee?.employeeId) {
                    // Extract the numeric part, handling both EMP001 and other formats
                    const matches = employee.employeeId.match(/EMP(\d+)/)
                    if (matches && matches[1]) {
                        const num = parseInt(matches[1], 10) || 0
                        maxNumber = Math.max(maxNumber, num)
                    }
                }
            })

            // Generate next number with a random component to avoid collisions
            const nextNumber = (maxNumber + 1).toString().padStart(3, "0")
            const newId = `EMP${nextNumber}`

            // Verify this ID doesn't already exist (extra safety check)
            const exists = employees.some(emp => emp.employeeId === newId)
            if (exists) {
                // If it somehow exists, add a random suffix
                const random = Math.floor(Math.random() * 100)
                return `EMP${nextNumber}-${random}`
            }

            return newId
        } catch (error) {
            console.error("Error generating employee ID:", error)
            // Fallback to a timestamp-based ID if something goes wrong
            const timestamp = Date.now().toString().slice(-3)
            return `EMP${timestamp}`
        }
    }

    const handleAdd = e => {
        if (e && e.preventDefault) {
            e.preventDefault() // Prevent the default button click behavior if it's an event
        }
        const nextEmployeeId = getNextEmployeeId()
        setEditingUser({ employeeId: nextEmployeeId })
        setShowForm(true)
    }

    const handleEdit = employee => {
        // Make sure we have all the necessary data
        setEditingUser({
            id: employee.id,
            employeeId: employee.employeeId,
            userId: employee.userId,
            position: employee.position,
            DepartmentId: employee.DepartmentId,
            hireDate: employee.hireDate,
            status: employee.status,
        })
        setShowForm(true)
    }

    const handleFormCancel = () => {
        setShowForm(false)
        setEditingUser(null)
    }

    const handleWorkflows = employee => {
        setSelectedEmployee(employee)
        setShowWorkflowsForm(true)
    }

    const handleWorkflowsClose = () => {
        setShowWorkflowsForm(false)
        setSelectedEmployee(null)
    }

    const handleTransfer = employee => {
        setTransferringEmployee(employee)
        setShowTransferForm(true)
    }

    const handleTransferSubmit = async formData => {
        try {
            if (!USE_FAKE_BACKEND) {
                await backendConnection.transferEmployee(transferringEmployee.id, formData.departmentId)
            } else {
                // Fetch departments to get names
                const departmentsResponse = await fakeFetch("/departments", { method: "GET" })
                const departments = await departmentsResponse.json()

                const oldDept = departments.find(d => d.id === transferringEmployee.departmentId)
                const newDept = departments.find(d => d.id === formData.departmentId)

                // Update employee's department
                await fakeFetch(`/employees/${transferringEmployee.id}`, {
                    method: "PUT",
                    body: { ...transferringEmployee, departmentId: formData.departmentId },
                })

                // Add a workflow entry for the transfer
                await fakeFetch(`/workflows`, {
                    method: "POST",
                    body: {
                        EmployeeId: transferringEmployee.id,
                        type: "Department Transfer",
                        details: {
                            task: `Employee transferred from ${oldDept ? oldDept.name : "Unknown"} to ${
                                newDept ? newDept.name : "Unknown"
                            }.`,
                        },
                        status: "Pending",
                    },
                })
            }
            await loadEmployeesData()
            showToast("success", "Employee transferred successfully!")
            setShowTransferForm(false)
            setTransferringEmployee(null)
        } catch (err) {
            console.error("Error transferring employee:", err)
            showToast("error", err.message || "An error occurred while transferring the employee")
        }
    }

    const handleTransferCancel = () => {
        setShowTransferForm(false)
        setTransferringEmployee(null)
    }

    const handleDelete = async employee => {
        if (window.confirm(`Are you sure you want to delete employee ${employee.employeeId}?`)) {
            try {
                if (!USE_FAKE_BACKEND) {
                    await backendConnection.deleteEmployee(employee.id)
                } else {
                    // Using fake backend
                    await fakeFetch(`/employees/${employee.id}`, {
                        method: "DELETE",
                    })
                }
                showToast("success", "Employee deleted successfully!")
                await loadEmployeesData()
            } catch (error) {
                console.error("Error deleting employee:", error)
                showToast("error", error.message || "Failed to delete employee")
            }
        }
    }

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div id="table-header" className="flex flex-row justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold capitalize text-foreground">EMPLOYEES</h1>
                    <div className="flex items-center space-x-4">
                        <ButtonWithIcon
                            icon={IoAddSharp}
                            text="Employee"
                            tooltipContent="Add New Employee"
                            onClick={handleAdd}
                            variant="primary"
                        />
                    </div>
                </div>
                <hr className="mb-4" />

                {loading && employees.length > 0 && (
                    <div className="flex justify-center my-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce200"></div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce400"></div>
                            <span className="text-sm text-gray-500">Refreshing data...</span>
                        </div>
                    </div>
                )}
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
                                        {employee.departmentName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start text-foreground">
                                        {new Date(employee.hireDate).toLocaleDateString("en-CA")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-start">
                                        {handleStatus(employee.status)}
                                    </td>
                                    <td className="flex px-6 py-4 whitespace-nowrap text-start gap-2">
                                        <ButtonWithIcon
                                            icon={GoGitPullRequest}
                                            text=""
                                            tooltipContent="Request"
                                            onClick={() => navigate("/requests")}
                                            variant="orange"
                                        />
                                        <ButtonWithIcon
                                            icon={GoWorkflow}
                                            text=""
                                            tooltipContent="Workflows"
                                            onClick={() => handleWorkflows(employee)}
                                            variant="pink"
                                        />
                                        <ButtonWithIcon
                                            icon={TbTransfer}
                                            text=""
                                            tooltipContent="Transfer"
                                            onClick={() => handleTransfer(employee)}
                                            variant="warning"
                                        />
                                        <ButtonWithIcon
                                            icon={CiEdit}
                                            text=""
                                            tooltipContent="Edit"
                                            onClick={() => handleEdit(employee)}
                                            variant="primary"
                                        />
                                        <ButtonWithIcon
                                            icon={FaTrash}
                                            text=""
                                            tooltipContent="Delete"
                                            onClick={() => handleDelete(employee)}
                                            variant="destructive"
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
            {showTransferForm && (
                <TransferForm
                    onSubmit={handleTransferSubmit}
                    onCancel={handleTransferCancel}
                    initialData={transferringEmployee}
                />
            )}
            {showWorkflowsForm && <WorkflowsForm initialData={selectedEmployee} onCancel={handleWorkflowsClose} />}
        </>
    )
}

export default Employees
