import React, { useState, useEffect } from "react"
import { useFakeBackend } from "../api/fakeBackend"
import backendConnection from "../api/BackendConnection"
import { USE_FAKE_BACKEND } from "../api/config"
import LoadingButton from "./LoadingButton"

// UI Components
import { BiArrowBack } from "react-icons/bi"
import { showToast } from "../util/alertHelper"

function WorkflowsForm({ initialData, onCancel }) {
    const { fakeFetch } = useFakeBackend()
    const [workflows, setWorkflows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusUpdating, setStatusUpdating] = useState({})

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true)
                let data

                if (!USE_FAKE_BACKEND) {
                    // Use real backend
                    data = await backendConnection.getWorkflowsByEmployeeId(initialData.id)
                } else {
                    // Use fake backend
                    const response = await fakeFetch(`/workflows/employee/${initialData.id}`)
                    data = await response.json()
                    if (data.error) {
                        throw new Error(data.error)
                    }
                }

                // Ensure data is an array
                setWorkflows(Array.isArray(data) ? data : [])
                setError(null)
            } catch (error) {
                console.error("Error fetching workflows:", error)
                setError("Failed to load workflows")
                showToast("error", "Failed to load workflows")
                setWorkflows([])
            } finally {
                setLoading(false)
            }
        }
        fetchWorkflows()
    }, [fakeFetch, initialData.id])

    const handleStatusChange = async (workflowId, newStatus) => {
        setStatusUpdating(prev => ({ ...prev, [workflowId]: true }))
        try {
            if (!USE_FAKE_BACKEND) {
                // Use real backend
                await backendConnection.updateWorkflow(workflowId, { status: newStatus })
                // Refresh workflows after update
                const updatedWorkflows = await backendConnection.getWorkflowsByEmployeeId(initialData.id)
                setWorkflows(Array.isArray(updatedWorkflows) ? updatedWorkflows : [])
            } else {
                // Use fake backend
                await fakeFetch(`/workflows/${workflowId}/status`, {
                    method: "PUT",
                    body: { status: newStatus },
                })
                // Update local state
                setWorkflows(prev => prev.map(w => (w.id === workflowId ? { ...w, status: newStatus } : w)))
            }
            showToast("success", "Workflow status updated successfully")
        } catch (error) {
            console.error("Error updating workflow status:", error)
            showToast("error", "Failed to update workflow status")
        } finally {
            setStatusUpdating(prev => ({ ...prev, [workflowId]: false }))
        }
    }

    // Helper function to safely render workflow details
    const renderWorkflowDetails = details => {
        if (!details) return "No details available"

        try {
            // If details is a string (JSON string), try to parse it
            if (typeof details === "string") {
                try {
                    const parsedDetails = JSON.parse(details)
                    return formatDetails(parsedDetails)
                } catch {
                    // If parsing fails, return the string as is
                    return details
                }
            }

            // If details is an object
            return formatDetails(details)
        } catch (error) {
            console.error("Error rendering workflow details:", error)
            return "Error displaying details"
        }
    }

    // Helper function to format details object
    const formatDetails = details => {
        if (typeof details !== "object" || details === null) {
            return String(details)
        }

        // If details has a task property
        if (details.task) {
            return details.task
        }

        // Otherwise, format the first few properties
        const entries = Object.entries(details)
        if (entries.length === 0) return "No details"

        // Format first 2 properties
        return entries
            .slice(0, 2)
            .map(([key, value]) => {
                return `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`
            })
            .join(", ")
    }

    function handleStatus(status) {
        const statusStyles = {
            Approved: "bg-green-400",
            Rejected: "bg-red-400",
            Pending: "bg-yellow-400",
        }

        return (
            <span className={`px-3 py-1 rounded-full text-md font-medium text-white ${statusStyles[status]}`}>
                {status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce200"></div>
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce400"></div>
                        <span>Loading workflows...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-lg shadow-lg">
                    <p className="text-red-500">Error: {error}</p>
                    <LoadingButton
                        onClick={onCancel}
                        className="mt-4 flex gap-2 items-center justify-center bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors"
                    >
                        <BiArrowBack /> Back to Employees
                    </LoadingButton>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-[80%] w-full">
                <div className="space-y-4">
                    <header className="text-2xl font-bold text-foreground mb-6">
                        Workflows for Employee: {initialData.employeeId}
                    </header>
                    <div className="space-y-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                                        Details
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
                                {workflows && workflows.length > 0 ? (
                                    workflows.map(workflow => (
                                        <tr key={workflow.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {workflow.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {renderWorkflowDetails(workflow.details)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {handleStatus(workflow.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {statusUpdating[workflow.id] ? (
                                                    <span className="flex items-center">
                                                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="none"
                                                            ></circle>
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        Updating...
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={workflow.status}
                                                        onChange={e => handleStatusChange(workflow.id, e.target.value)}
                                                        className="rounded-md border border-gray-300 px-2 py-1"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Approved">Approved</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No workflows found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex justify-end space-x-3 mt-6">
                            <LoadingButton
                                onClick={onCancel}
                                className="flex gap-2 items-center justify-center bg-green-400 text-primary hover:bg-green-600 hover:text-background transition-colors"
                            >
                                <BiArrowBack /> Back to Employees
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkflowsForm
