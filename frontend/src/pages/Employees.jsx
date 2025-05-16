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
    const [departments, setDepartments] = useState([])

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

            setDepartments(departmentsData)

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
            if (!USE_FAKE_BACKEND) {
                // Use real backend
                if (editingUser?.id) {
                    await backendConnection.updateEmployee(editingUser.id, formData)
                } else {
                    await backendConnection.createEmployee(formData)
                }

                // Refresh the employees list
                await loadEmployeesData()
            } else {
                // Use fake backend
                const method = editingUser ? "PUT" : "POST"
                const url = editingUser ? `/employees/${editingUser.id}` : "/employees"

                const response = await fakeFetch(url, {
                    method,
                    body: formData,
                })

                const data = await response.json()
                if (data.error) {
                    throw new Error(data.error)
                }

                // Refresh the employees list
                await loadEmployeesData()
            }

            showToast("success", `Employee ${editingUser ? "updated" : "created"} successfully!`)
            setShowForm(false)
            setEditingUser(null)
        } catch (err) {
            console.error("Error submitting employee:", err)
            showToast("error", err.message || "An error occurred while saving the employee")
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
    const getNextEmployeeId = () => {
        try {
            // If no employees exist, start with EMP001
            if (!employees || employees.length === 0) {
                console.log("No employees found, starting with EMP001")
                return "EMP001"
            }

            console.log("Current employees:", employees)

            // Find the highest employee ID
            let maxNumber = 0
            employees.forEach(employee => {
                if (employee?.employeeId) {
                    const num = parseInt(employee.employeeId.replace("EMP", "")) || 0
                    maxNumber = Math.max(maxNumber, num)
                }
            })

            console.log("Max employee number found:", maxNumber)

            // Generate next number
            const nextNumber = (maxNumber + 1).toString().padStart(3, "0")
            const newId = `EMP${nextNumber}`

            console.log("Generated new employee ID:", newId)
            return newId
        } catch (error) {
            console.error("Error generating employee ID:", error)
            // Fallback to a timestamp-based ID if something goes wrong
            const timestamp = Date.now().toString().slice(-3)
            return `EMP${timestamp}`
        }
    }

    const handleAdd = () => {
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
                // ...fake backend logic...
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
