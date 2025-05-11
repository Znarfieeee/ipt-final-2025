import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"

// UI Libraries
import { GoGitPullRequest, GoWorkflow } from "react-icons/go"
import { TbTransfer } from "react-icons/tb"
import { CiEdit } from "react-icons/ci"
import { TooltipButton } from "@/util/TooltipHelper"

function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
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

                setEmployees(employeesData)
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

    return (
        <>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div id="table-header" className="flex flex-row justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold capitalize text-foreground">EMPLOYEES</h1>
                    <button className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer">
                        Add Employee
                    </button>
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
                                        <TooltipButton
                                            content="Request"
                                            className="bg-orange-500 px-3 text-md font-medium py-3 rounded-md text-white hover:bg-orange-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            <GoGitPullRequest />
                                        </TooltipButton>

                                        <TooltipButton
                                            content="Workflows"
                                            className="bg-pink-500 px-3 text-md font-medium py-3 rounded-md text-white hover:bg-pink-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            <GoWorkflow />
                                        </TooltipButton>

                                        <TooltipButton
                                            content="Transfer"
                                            className="bg-yellow-500 px-3 text-md font-medium py-3 rounded-md text-white hover:bg-yellow-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            <TbTransfer />
                                        </TooltipButton>

                                        <TooltipButton
                                            content="Edit"
                                            className="bg-blue-500 px-3 text-md font-medium py-3 rounded-md text-white hover:bg-blue-700 delay-50 transition-all duration-300 hover:scale-105 cursor-pointer"
                                        >
                                            <CiEdit />
                                        </TooltipButton>
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
        </>
    )
}

export default Employees
